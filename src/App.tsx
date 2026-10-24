import { useMemo, useRef, useState, type ChangeEvent } from 'react'
import {
  IMPORT_CONTROL,
  RENDER_MANIFEST_CONTROLS,
  RENDER_ORCHESTRATION_CONTROLS,
  describeImportedArtifact,
  describeManifestControls,
  describeOrchestrationControls,
  type OperationFeedback,
} from './app-control-contract'
import {
  createRenderHandoffManifest,
  createRenderOrchestrationPlan,
  exportProjectPackage,
  formatDuration,
  parseProjectPackage,
  reorderProjectSequences,
  reorderSequenceBeats,
  slugify,
  type ComicBookVideoProjectPackage,
  type MotionBeat,
  type MotionSequence,
} from './project-package'
import { sampleComicBookVideoProject } from './sample-project'

const STORAGE_KEY = 'comic-book-video-generator.project'

function App() {
  const [project, setProject] = useState<ComicBookVideoProjectPackage>(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (!saved) {
      return sampleComicBookVideoProject
    }

    try {
      return parseProjectPackage(saved)
    } catch {
      return sampleComicBookVideoProject
    }
  })
  const [operationFeedback, setOperationFeedback] = useState<OperationFeedback>({
    tone: 'neutral',
    message: 'Ready',
    details: 'Import a comic handoff package or export a local render manifest when the timeline is ready.',
  })
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const persist = (nextProject: ComicBookVideoProjectPackage) => {
    setProject(nextProject)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextProject, null, 2))
  }

  const updateProject = (
    updater: (current: ComicBookVideoProjectPackage) => ComicBookVideoProjectPackage,
  ) => {
    persist(updater(project))
  }

  const metrics = useMemo(() => {
    const totalRuntime = project.scenes.reduce((sum, scene) => sum + scene.runtimeSeconds, 0)
    const totalBeats = project.scenes.reduce((sum, scene) => sum + scene.beats.length, 0)

    return {
      sequences: project.scenes.length,
      runtime: totalRuntime,
      beats: totalBeats,
      outputs: project.outputs.length,
    }
  }, [project])

  const timingSummary = useMemo(() => {
    let cursorSeconds = 0

    const sequenceRows = project.scenes.map((sequence, index) => {
      const runtimeSeconds = Math.max(0, Math.round(sequence.runtimeSeconds || 0))
      const beatSeconds = sequence.beats.reduce(
        (sum, beat) => sum + Math.max(0, Math.round(beat.durationSeconds || 0)),
        0,
      )
      const startSeconds = cursorSeconds
      const endSeconds = startSeconds + runtimeSeconds

      cursorSeconds = endSeconds

      return {
        id: sequence.id,
        index: index + 1,
        title: sequence.title || `Sequence ${index + 1}`,
        sourcePage: sequence.sourcePage,
        sourcePanels: sequence.sourcePanels,
        runtimeSeconds,
        beatCount: sequence.beats.length,
        beatSeconds,
        startSeconds,
        endSeconds,
        beatCoverage:
          runtimeSeconds > 0 ? Math.min(100, Math.round((beatSeconds / runtimeSeconds) * 100)) : 0,
      }
    })

    const longestSequence = sequenceRows.reduce<(typeof sequenceRows)[number] | null>(
      (longest, current) => (!longest || current.runtimeSeconds > longest.runtimeSeconds ? current : longest),
      null,
    )

    const totalBeatSeconds = sequenceRows.reduce((sum, row) => sum + row.beatSeconds, 0)
    const totalRuntimeSeconds = sequenceRows.reduce((sum, row) => sum + row.runtimeSeconds, 0)
    const totalBeatCount = sequenceRows.reduce((sum, row) => sum + row.beatCount, 0)

    return {
      sequenceRows,
      totalRuntimeSeconds,
      totalBeatSeconds,
      totalBeatCount,
      averageSequenceSeconds: sequenceRows.length
        ? Math.round(totalRuntimeSeconds / sequenceRows.length)
        : 0,
      averageBeatSeconds: totalBeatCount ? Math.max(1, Math.round(totalBeatSeconds / totalBeatCount)) : 0,
      longestSequence,
    }
  }, [project])

  const renderHandoffManifest = useMemo(() => createRenderHandoffManifest(project), [project])
  const renderOrchestrationPlan = useMemo(() => createRenderOrchestrationPlan(project), [project])
  const manifestControlSummary = useMemo(
    () => describeManifestControls(renderHandoffManifest),
    [renderHandoffManifest],
  )
  const orchestrationControlSummary = useMemo(
    () => describeOrchestrationControls(renderOrchestrationPlan),
    [renderOrchestrationPlan],
  )

  const cueSheetBrief = useMemo(() => {
    const lines = [
      `Comic motion brief: ${project.title || 'Untitled project'}`,
      `Target format: ${project.inputs.targetFormat || 'Motion-comic deliverable'}`,
      `Total runtime: ${formatDuration(timingSummary.totalRuntimeSeconds)}`,
      `Sequences: ${timingSummary.sequenceRows.length}`,
      `Beat blocks: ${timingSummary.totalBeatCount}`,
    ]

    if (timingSummary.longestSequence) {
      lines.push(
        `Longest scene: ${timingSummary.longestSequence.title} (${formatDuration(timingSummary.longestSequence.runtimeSeconds)})`,
      )
    }

    lines.push('', 'Cue sheet')

    timingSummary.sequenceRows.forEach((row) => {
      lines.push(
        `${row.index}. ${row.title} | ${formatDuration(row.startSeconds)}-${formatDuration(row.endSeconds)} | ${row.beatCount} beat${row.beatCount === 1 ? '' : 's'} | ${row.beatCoverage}% coverage`,
      )
    })

    return lines.join('\n')
  }, [project, timingSummary])

  const addSequence = () => {
    updateProject((current) => ({
      ...current,
      scenes: [
        ...current.scenes,
        {
          id: crypto.randomUUID(),
          title: `Sequence ${current.scenes.length + 1}`,
          sourcePage: current.scenes.length + 1,
          sourcePanels: '1-2',
          runtimeSeconds: 10,
          transitionIn: '',
          transitionOut: '',
          motionPlan: '',
          narrationNotes: '',
          soundNotes: '',
          beats: [
            {
              id: crypto.randomUUID(),
              label: 'Beat 1',
              sourcePanel: '1',
              durationSeconds: 4,
              movement: '',
              captionOverlay: '',
              narration: '',
              soundCue: '',
            },
          ],
        },
      ],
      updatedAt: new Date().toISOString(),
    }))
  }

  const addBeat = (sequenceId: string) => {
    updateProject((current) => ({
      ...current,
      scenes: current.scenes.map((sequence) =>
        sequence.id === sequenceId
          ? {
              ...sequence,
              beats: [
                ...sequence.beats,
                {
                  id: crypto.randomUUID(),
                  label: `Beat ${sequence.beats.length + 1}`,
                  sourcePanel: String(sequence.beats.length + 1),
                  durationSeconds: 4,
                  movement: '',
                  captionOverlay: '',
                  narration: '',
                  soundCue: '',
                },
              ],
            }
          : sequence,
      ),
      updatedAt: new Date().toISOString(),
    }))
  }

  const addOutput = () => {
    updateProject((current) => ({
      ...current,
      outputs: [
        ...current.outputs,
        {
          id: crypto.randomUUID(),
          label: `Output ${current.outputs.length + 1}`,
          status: 'planned',
          target: 'Motion-comic deliverable',
        },
      ],
      updatedAt: new Date().toISOString(),
    }))
  }

  const handleImportClick = () => fileInputRef.current?.click()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(project, null, 2))
      setOperationFeedback({
        tone: 'success',
        message: 'Copied package JSON',
        details: 'The editable creative-project-package-v1 JSON is on the clipboard.',
      })
    } catch (error) {
      setOperationFeedback({
        tone: 'error',
        message: 'Copy failed',
        details: error instanceof Error ? error.message : 'Check browser clipboard permissions.',
      })
    }
  }

  const handleCopyCueSheet = async () => {
    try {
      await navigator.clipboard.writeText(cueSheetBrief)
      setOperationFeedback({
        tone: 'success',
        message: 'Copied cue sheet brief',
        details: 'The plain-text timing brief is on the clipboard.',
      })
    } catch (error) {
      setOperationFeedback({
        tone: 'error',
        message: 'Cue sheet copy failed',
        details: error instanceof Error ? error.message : 'Check browser clipboard permissions.',
      })
    }
  }

  const handleCopyArtifact = async (label: string, artifact: unknown) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(artifact, null, 2))
      setOperationFeedback({
        tone: 'success',
        message: `Copied ${label}`,
        details: 'The selected render handoff artifact is on the clipboard.',
      })
    } catch (error) {
      setOperationFeedback({
        tone: 'error',
        message: `${label} copy failed`,
        details: error instanceof Error ? error.message : 'Check browser clipboard permissions.',
      })
    }
  }

  const handleExportArtifact = (label: string, suffix: string, artifact: unknown) => {
    downloadJson(`${project.slug || 'comic-book-video'}-${suffix}.json`, artifact)
    setOperationFeedback({
      tone: 'success',
      message: `Exported ${label}`,
      details: 'A local JSON download was generated. No media render or external connector was started.',
    })
  }

  const moveSequence = (sequenceId: string, direction: -1 | 1) => {
    try {
      updateProject((current) => {
        const currentIndex = current.scenes.findIndex((sequence) => sequence.id === sequenceId)
        const nextIndex = currentIndex + direction

        if (currentIndex < 0 || nextIndex < 0 || nextIndex >= current.scenes.length) {
          return current
        }

        const nextOrder = current.scenes.map((sequence) => sequence.id)
        const [movedSequenceId] = nextOrder.splice(currentIndex, 1)
        nextOrder.splice(nextIndex, 0, movedSequenceId)

        return {
          ...reorderProjectSequences(current, nextOrder),
          updatedAt: new Date().toISOString(),
        }
      })
      setOperationFeedback({
        tone: 'success',
        message: 'Sequence order updated',
        details: 'The verified package reorder helper accepted the complete sequence order.',
      })
    } catch (error) {
      setOperationFeedback({
        tone: 'error',
        message: 'Sequence reorder rejected',
        details: error instanceof Error ? error.message : 'The sequence order could not be validated.',
      })
    }
  }

  const moveBeat = (sequenceId: string, beatId: string, direction: -1 | 1) => {
    try {
      updateProject((current) => {
        const sequence = current.scenes.find((item) => item.id === sequenceId)
        const currentIndex = sequence?.beats.findIndex((beat) => beat.id === beatId) ?? -1
        const nextIndex = currentIndex + direction

        if (!sequence || currentIndex < 0 || nextIndex < 0 || nextIndex >= sequence.beats.length) {
          return current
        }

        const nextOrder = sequence.beats.map((beat) => beat.id)
        const [movedBeatId] = nextOrder.splice(currentIndex, 1)
        nextOrder.splice(nextIndex, 0, movedBeatId)

        return {
          ...reorderSequenceBeats(current, sequenceId, nextOrder),
          updatedAt: new Date().toISOString(),
        }
      })
      setOperationFeedback({
        tone: 'success',
        message: 'Beat order updated',
        details: 'The verified package reorder helper accepted the complete beat order.',
      })
    } catch (error) {
      setOperationFeedback({
        tone: 'error',
        message: 'Beat reorder rejected',
        details: error instanceof Error ? error.message : 'The beat order could not be validated.',
      })
    }
  }

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    try {
      const text = await file.text()
      const importedProject = parseProjectPackage(text)
      const feedback = describeImportedArtifact(text, importedProject, file.name)
      persist(importedProject)
      setOperationFeedback(feedback)
    } catch (error) {
      setOperationFeedback({
        tone: 'error',
        message: 'Import rejected',
        details: error instanceof Error ? error.message : 'Check the JSON package. No changes were applied.',
      })
    } finally {
      event.target.value = ''
    }
  }

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero-copy">
          <span className="eyebrow">Motion Comic Planner</span>
          <h1>Comic Book Video Generator</h1>
          <p>
            Turn comic pages into motion-comic sequences with timeline beats, narration timing,
            caption overlays, soundtrack cues, and cut-ready deliverables.
          </p>
          <div className="hero-actions">
            <button onClick={() => exportProjectPackage(project)}>Export Package</button>
            <button className="secondary" onClick={handleCopy}>
              Copy JSON
            </button>
            <button className="secondary" onClick={handleImportClick}>
              {IMPORT_CONTROL.label}
            </button>
            <button
              className="ghost"
              onClick={() => {
                persist(sampleComicBookVideoProject)
                setOperationFeedback({
                  tone: 'success',
                  message: 'Sample project loaded',
                  details: 'The local sample project replaced the current draft.',
                })
              }}
            >
              Load Sample
            </button>
          </div>
          <div className={`feedback-box feedback-box--${operationFeedback.tone}`} role={operationFeedback.tone === 'error' ? 'alert' : 'status'}>
            <strong>{operationFeedback.message}</strong>
            {operationFeedback.details ? <span>{operationFeedback.details}</span> : null}
          </div>
        </div>
        <div className="metric-grid">
          <MetricCard label="Sequences" value={String(metrics.sequences)} />
          <MetricCard label="Runtime" value={formatDuration(metrics.runtime)} />
          <MetricCard label="Beat Blocks" value={String(metrics.beats)} />
          <MetricCard label="Outputs" value={String(metrics.outputs)} />
        </div>
      </header>

      <section className="panel panel-full timing-panel">
        <div className="panel-heading">
          <div>
            <span className="panel-kicker">Planning cue sheet</span>
            <h2>Timing summary</h2>
          </div>
          <div className="inline-actions">
            <span className="helper-chip">
              {timingSummary.sequenceRows.length} sequence{timingSummary.sequenceRows.length === 1 ? '' : 's'}
            </span>
            <span className="helper-chip">{formatDuration(timingSummary.totalRuntimeSeconds)} total runtime</span>
            <button className="secondary tiny" onClick={handleCopyCueSheet}>
              Copy Cue Sheet
            </button>
            <button
              className="secondary tiny"
              onClick={() => handleCopyArtifact('render handoff manifest', renderHandoffManifest)}
            >
              {RENDER_MANIFEST_CONTROLS.copyLabel}
            </button>
            <button
              className="secondary tiny"
              onClick={() => handleExportArtifact('render handoff manifest', 'render-handoff', renderHandoffManifest)}
            >
              {RENDER_MANIFEST_CONTROLS.exportLabel}
            </button>
            <button
              className="secondary tiny"
              onClick={() => handleCopyArtifact('render orchestration plan', renderOrchestrationPlan)}
            >
              {RENDER_ORCHESTRATION_CONTROLS.copyLabel}
            </button>
            <button
              className="secondary tiny"
              onClick={() => handleExportArtifact('render orchestration plan', 'render-orchestration', renderOrchestrationPlan)}
            >
              {RENDER_ORCHESTRATION_CONTROLS.exportLabel}
            </button>
          </div>
        </div>
        <div className="metric-grid metric-grid--compact">
          <MetricCard label="Total runtime" value={formatDuration(timingSummary.totalRuntimeSeconds)} />
          <MetricCard label="Average sequence" value={formatDuration(timingSummary.averageSequenceSeconds)} />
          <MetricCard label="Average beat" value={formatDuration(timingSummary.averageBeatSeconds)} />
          <MetricCard label="Beat blocks" value={String(timingSummary.totalBeatCount)} />
        </div>
        <div className={`handoff-status ${renderHandoffManifest.consistency.cutReady ? 'handoff-status--go' : 'handoff-status--review'}`}>
          <div>
            <span className="panel-kicker">Timeline consistency</span>
            <h3>{manifestControlSummary.heading}</h3>
            <p>{manifestControlSummary.details}</p>
          </div>
          <div className="consistency-stats">
            <span>{manifestControlSummary.timelineLabel}</span>
            <span>{manifestControlSummary.narrationLabel}</span>
            <span>{manifestControlSummary.sfxLabel}</span>
          </div>
        </div>
        <div className={`handoff-status ${renderOrchestrationPlan.readiness.goNoGo === 'GO' ? 'handoff-status--go' : 'handoff-status--review'}`}>
          <div>
            <span className="panel-kicker">Render orchestration</span>
            <h3>{orchestrationControlSummary.heading}</h3>
            <p>{orchestrationControlSummary.details}</p>
          </div>
          <div className="consistency-stats">
            <span>{orchestrationControlSummary.passLabel}</span>
            <span>{orchestrationControlSummary.taskLabel}</span>
            <span>{orchestrationControlSummary.generationLabel}</span>
          </div>
        </div>
        <div className="orchestration-grid" aria-label="Render orchestration passes">
          {renderOrchestrationPlan.passes.map((pass) => (
            <article className={`orchestration-pass orchestration-pass--${pass.status}`} key={pass.id}>
              <span className="panel-kicker">{pass.stage}</span>
              <strong>{pass.label}</strong>
              <p>
                {pass.taskCount} local task{pass.taskCount === 1 ? '' : 's'} · {pass.status === 'ready' ? 'ready' : 'needs review'}
              </p>
            </article>
          ))}
        </div>
        {renderOrchestrationPlan.issues.length > 0 ? (
          <div className="issue-list" aria-label="Render orchestration issues">
            {renderOrchestrationPlan.issues.slice(0, 6).map((issue) => (
              <div className={`issue-pill issue-pill--${issue.severity}`} key={issue.id}>
                <strong>{issue.severity}</strong>
                <span>{issue.summary}</span>
              </div>
            ))}
            {renderOrchestrationPlan.issues.length > 6 ? (
              <p className="summary-footnote">
                {renderOrchestrationPlan.issues.length - 6} more orchestration issue
                {renderOrchestrationPlan.issues.length - 6 === 1 ? '' : 's'} in the local queue plan.
              </p>
            ) : null}
          </div>
        ) : null}
        {renderHandoffManifest.consistency.issues.length > 0 ? (
          <div className="issue-list" aria-label="Timeline consistency issues">
            {renderHandoffManifest.consistency.issues.slice(0, 6).map((issue) => (
              <div className={`issue-pill issue-pill--${issue.severity}`} key={issue.id}>
                <strong>{issue.severity}</strong>
                <span>{issue.summary}</span>
              </div>
            ))}
            {renderHandoffManifest.consistency.issues.length > 6 ? (
              <p className="summary-footnote">
                {renderHandoffManifest.consistency.issues.length - 6} more timing issue
                {renderHandoffManifest.consistency.issues.length - 6 === 1 ? '' : 's'} in the manifest.
              </p>
            ) : null}
          </div>
        ) : null}
        <div className="artifact-actions" aria-label="Render handoff artifact controls">
          <button
            className="secondary tiny"
            onClick={() => handleCopyArtifact('cut-ready timeline', renderHandoffManifest.timeline)}
          >
            Copy Timeline JSON
          </button>
          <button
            className="secondary tiny"
            onClick={() => handleCopyArtifact('narration script', renderHandoffManifest.narrationScript)}
          >
            Copy Narration JSON
          </button>
          <button
            className="secondary tiny"
            onClick={() => handleCopyArtifact('SFX cue list', renderHandoffManifest.sfxCueList)}
          >
            Copy SFX JSON
          </button>
        </div>
        <div className="summary-note">
          <strong>Export note</strong>
          <p>
            The motion plan is easiest to export when each scene reads as a timed window, so this cue sheet
            shows the sequence order, cumulative window, and beat coverage before you hand it off.
          </p>
        </div>
        <div className="cue-sheet-preview">
          <div className="cue-sheet-preview__header">
            <strong>Handoff brief</strong>
            <span>Copy-ready for editors, narration, or soundtrack planning.</span>
          </div>
          <pre>{cueSheetBrief}</pre>
        </div>
        <div className="timeline-list">
          {timingSummary.sequenceRows.length === 0 ? (
            <div className="empty-state">Add a sequence to generate a runtime cue sheet.</div>
          ) : (
            timingSummary.sequenceRows.map((row) => (
              <article className="timeline-row" key={row.id}>
                <div className="timeline-row__copy">
                  <strong>
                    {row.index}. {row.title}
                  </strong>
                  <p className="card-caption">
                    Page {row.sourcePage} | Panels {row.sourcePanels || 'TBD'} | {row.beatCount} beat block
                    {row.beatCount === 1 ? '' : 's'}
                  </p>
                </div>
                <div className="timeline-row__meta">
                  <span>{formatDuration(row.startSeconds)} - {formatDuration(row.endSeconds)}</span>
                  <span>{formatDuration(row.runtimeSeconds)} runtime</span>
                  <span>{formatDuration(row.beatSeconds)} of beats</span>
                  <span>{row.beatCoverage}% beat coverage</span>
                  {renderHandoffManifest.timeline.find((sequence) => sequence.id === row.id)?.gapSeconds ? (
                    <span className="timeline-warning">
                      {formatDuration(renderHandoffManifest.timeline.find((sequence) => sequence.id === row.id)?.gapSeconds ?? 0)} gap
                    </span>
                  ) : null}
                  {renderHandoffManifest.timeline.find((sequence) => sequence.id === row.id)?.overflowSeconds ? (
                    <span className="timeline-error">
                      {formatDuration(renderHandoffManifest.timeline.find((sequence) => sequence.id === row.id)?.overflowSeconds ?? 0)} overflow
                    </span>
                  ) : null}
                </div>
              </article>
            ))
          )}
        </div>
        {timingSummary.longestSequence ? (
          <p className="summary-footnote">
            Longest scene: {timingSummary.longestSequence.title} at{' '}
            {formatDuration(timingSummary.longestSequence.runtimeSeconds)}.
          </p>
        ) : null}
      </section>

      <main className="workspace-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <span className="panel-kicker">Setup</span>
              <h2>Source comic and direction</h2>
            </div>
          </div>
          <div className="field-grid">
            <Field
              label="Project title"
              value={project.title}
              onChange={(value) =>
                updateProject((current) => ({
                  ...current,
                  title: value,
                  slug: slugify(value),
                  updatedAt: new Date().toISOString(),
                }))
              }
            />
            <Field
              label="Target format"
              value={project.inputs.targetFormat}
              onChange={(value) =>
                updateProject((current) => ({
                  ...current,
                  inputs: { ...current.inputs, targetFormat: value },
                  updatedAt: new Date().toISOString(),
                }))
              }
            />
            <Field
              label="Voice tone"
              value={project.inputs.voiceTone}
              onChange={(value) =>
                updateProject((current) => ({
                  ...current,
                  inputs: { ...current.inputs, voiceTone: value },
                  updatedAt: new Date().toISOString(),
                }))
              }
            />
            <Field
              label="Edit rhythm"
              value={project.inputs.editRhythm}
              onChange={(value) =>
                updateProject((current) => ({
                  ...current,
                  inputs: { ...current.inputs, editRhythm: value },
                  updatedAt: new Date().toISOString(),
                }))
              }
            />
          </div>
          <TextArea
            label="Source comic summary"
            value={project.summary}
            onChange={(value) =>
              updateProject((current) => ({
                ...current,
                summary: value,
                updatedAt: new Date().toISOString(),
              }))
            }
          />
          <TextArea
            label="Narration strategy"
            value={project.inputs.narrationStrategy}
            onChange={(value) =>
              updateProject((current) => ({
                ...current,
                inputs: { ...current.inputs, narrationStrategy: value },
                updatedAt: new Date().toISOString(),
              }))
            }
          />
          <div className="field-grid">
            <TextArea
              label="Sound targets"
              value={project.inputs.soundTargets.join('\n')}
              onChange={(value) =>
                updateProject((current) => ({
                  ...current,
                  inputs: { ...current.inputs, soundTargets: splitLines(value) },
                  updatedAt: new Date().toISOString(),
                }))
              }
            />
            <TextArea
              label="Delivery surfaces"
              value={project.inputs.deliverySurfaces.join('\n')}
              onChange={(value) =>
                updateProject((current) => ({
                  ...current,
                  inputs: { ...current.inputs, deliverySurfaces: splitLines(value) },
                  updatedAt: new Date().toISOString(),
                }))
              }
            />
          </div>
        </section>

        <section className="panel panel-full">
          <div className="panel-heading">
            <div>
              <span className="panel-kicker">Sequences</span>
              <h2>Panel-to-shot timeline</h2>
            </div>
            <button className="secondary" onClick={addSequence}>
              Add Sequence
            </button>
          </div>
          <div className="stack-list">
            {project.scenes.map((sequence, sequenceIndex) => (
              <SequenceEditor
                key={sequence.id}
                sequence={sequence}
                sequenceIndex={sequenceIndex}
                onChange={(patch) => updateSequence(project, sequence.id, persist, patch)}
                onRemove={() =>
                  updateProject((current) => ({
                    ...current,
                    scenes: current.scenes.filter((item) => item.id !== sequence.id),
                    updatedAt: new Date().toISOString(),
                  }))
                }
                canMoveUp={sequenceIndex > 0}
                canMoveDown={sequenceIndex < project.scenes.length - 1}
                onMoveSequence={(direction) => moveSequence(sequence.id, direction)}
                onAddBeat={() => addBeat(sequence.id)}
                onUpdateBeat={(beatId, patch) => updateBeat(project, sequence.id, beatId, persist, patch)}
                onMoveBeat={(beatId, direction) => moveBeat(sequence.id, beatId, direction)}
              />
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <span className="panel-kicker">Outputs</span>
              <h2>Deliverables and release cuts</h2>
            </div>
            <button className="secondary" onClick={addOutput}>
              Add Output
            </button>
          </div>
          <div className="stack-list">
            {project.outputs.map((output, index) => (
              <article className="stack-card" key={output.id}>
                <div className="stack-header compact">
                  <strong>{output.label}</strong>
                  <button
                    className="ghost tiny"
                    onClick={() =>
                      updateProject((current) => ({
                        ...current,
                        outputs: current.outputs.filter((item) => item.id !== output.id),
                        updatedAt: new Date().toISOString(),
                      }))
                    }
                  >
                    Remove
                  </button>
                </div>
                <div className="field-grid">
                  <Field
                    label="Label"
                    value={output.label}
                    onChange={(value) =>
                      updateProject((current) => ({
                        ...current,
                        outputs: current.outputs.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, label: value } : item,
                        ),
                        updatedAt: new Date().toISOString(),
                      }))
                    }
                  />
                  <Field
                    label="Status"
                    value={output.status}
                    onChange={(value) =>
                      updateProject((current) => ({
                        ...current,
                        outputs: current.outputs.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, status: value } : item,
                        ),
                        updatedAt: new Date().toISOString(),
                      }))
                    }
                  />
                </div>
                <Field
                  label="Target"
                  value={output.target}
                  onChange={(value) =>
                    updateProject((current) => ({
                      ...current,
                      outputs: current.outputs.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, target: value } : item,
                      ),
                      updatedAt: new Date().toISOString(),
                    }))
                  }
                />
              </article>
            ))}
          </div>
          <TextArea
            label="Working notes"
            value={project.notes.join('\n')}
            onChange={(value) =>
              updateProject((current) => ({
                ...current,
                notes: splitLines(value),
                updatedAt: new Date().toISOString(),
              }))
            }
          />
        </section>
      </main>

      <input
        ref={fileInputRef}
        className="hidden-file-input"
        type="file"
        accept={IMPORT_CONTROL.accept}
        onChange={handleImport}
      />
    </div>
  )
}

type SequenceEditorProps = {
  sequence: MotionSequence
  sequenceIndex: number
  onChange: (patch: Partial<MotionSequence>) => void
  onRemove: () => void
  canMoveUp: boolean
  canMoveDown: boolean
  onMoveSequence: (direction: -1 | 1) => void
  onAddBeat: () => void
  onUpdateBeat: (beatId: string, patch: Partial<MotionBeat>) => void
  onMoveBeat: (beatId: string, direction: -1 | 1) => void
}

function SequenceEditor({
  sequence,
  sequenceIndex,
  onChange,
  onRemove,
  canMoveUp,
  canMoveDown,
  onMoveSequence,
  onAddBeat,
  onUpdateBeat,
  onMoveBeat,
}: SequenceEditorProps) {
  return (
    <article className="stack-card cinematic-card">
      <div className="stack-header">
        <div>
          <strong>{sequence.title}</strong>
          <p className="card-caption">Sequence {sequenceIndex + 1}</p>
        </div>
        <div className="inline-actions">
          <button className="ghost tiny" disabled={!canMoveUp} onClick={() => onMoveSequence(-1)}>
            Move Up
          </button>
          <button className="ghost tiny" disabled={!canMoveDown} onClick={() => onMoveSequence(1)}>
            Move Down
          </button>
          <button className="secondary tiny" onClick={onAddBeat}>
            Add Beat
          </button>
          <button className="ghost tiny" onClick={onRemove}>
            Remove Sequence
          </button>
        </div>
      </div>
      <div className="field-grid three-up">
        <Field label="Sequence title" value={sequence.title} onChange={(value) => onChange({ title: value })} />
        <Field
          label="Source page"
          type="number"
          value={String(sequence.sourcePage)}
          onChange={(value) => onChange({ sourcePage: Number(value) || 0 })}
        />
        <Field
          label="Source panels"
          value={sequence.sourcePanels}
          onChange={(value) => onChange({ sourcePanels: value })}
        />
        <Field
          label="Runtime"
          type="number"
          value={String(sequence.runtimeSeconds)}
          onChange={(value) => onChange({ runtimeSeconds: Number(value) || 0 })}
        />
        <Field
          label="Transition in"
          value={sequence.transitionIn}
          onChange={(value) => onChange({ transitionIn: value })}
        />
        <Field
          label="Transition out"
          value={sequence.transitionOut}
          onChange={(value) => onChange({ transitionOut: value })}
        />
      </div>
      <TextArea label="Motion plan" value={sequence.motionPlan} onChange={(value) => onChange({ motionPlan: value })} />
      <div className="field-grid">
        <TextArea
          label="Narration notes"
          value={sequence.narrationNotes}
          onChange={(value) => onChange({ narrationNotes: value })}
        />
        <TextArea
          label="Soundtrack and SFX notes"
          value={sequence.soundNotes}
          onChange={(value) => onChange({ soundNotes: value })}
        />
      </div>
      <div className="subsection-heading">
        <span>Timeline beats</span>
        <strong>{sequence.beats.length} beat blocks</strong>
      </div>
      <div className="shot-grid">
        {sequence.beats.map((beat, beatIndex) => (
          <div className="shot-card" key={beat.id}>
            <div className="shot-card__header">
              <strong>{beat.label || `Beat ${beatIndex + 1}`}</strong>
              <div className="inline-actions">
                <button className="ghost tiny" disabled={beatIndex === 0} onClick={() => onMoveBeat(beat.id, -1)}>
                  Move Up
                </button>
                <button
                  className="ghost tiny"
                  disabled={beatIndex === sequence.beats.length - 1}
                  onClick={() => onMoveBeat(beat.id, 1)}
                >
                  Move Down
                </button>
              </div>
            </div>
            <div className="field-grid">
              <Field label="Label" value={beat.label} onChange={(value) => onUpdateBeat(beat.id, { label: value })} />
              <Field
                label="Source panel"
                value={beat.sourcePanel}
                onChange={(value) => onUpdateBeat(beat.id, { sourcePanel: value })}
              />
            </div>
            <div className="field-grid">
              <Field
                label="Duration"
                type="number"
                value={String(beat.durationSeconds)}
                onChange={(value) => onUpdateBeat(beat.id, { durationSeconds: Number(value) || 0 })}
              />
              <Field
                label="Movement"
                value={beat.movement}
                onChange={(value) => onUpdateBeat(beat.id, { movement: value })}
              />
            </div>
            <TextArea
              label="Caption overlay"
              value={beat.captionOverlay}
              onChange={(value) => onUpdateBeat(beat.id, { captionOverlay: value })}
            />
            <div className="field-grid">
              <TextArea
                label="Narration"
                value={beat.narration}
                onChange={(value) => onUpdateBeat(beat.id, { narration: value })}
              />
              <TextArea
                label="Sound cue"
                value={beat.soundCue}
                onChange={(value) => onUpdateBeat(beat.id, { soundCue: value })}
              />
            </div>
          </div>
        ))}
      </div>
    </article>
  )
}

function updateSequence(
  project: ComicBookVideoProjectPackage,
  sequenceId: string,
  persist: (project: ComicBookVideoProjectPackage) => void,
  patch: Partial<MotionSequence>,
) {
  persist({
    ...project,
    scenes: project.scenes.map((sequence) =>
      sequence.id === sequenceId ? { ...sequence, ...patch } : sequence,
    ),
    updatedAt: new Date().toISOString(),
  })
}

function updateBeat(
  project: ComicBookVideoProjectPackage,
  sequenceId: string,
  beatId: string,
  persist: (project: ComicBookVideoProjectPackage) => void,
  patch: Partial<MotionBeat>,
) {
  persist({
    ...project,
    scenes: project.scenes.map((sequence) =>
      sequence.id === sequenceId
        ? {
            ...sequence,
            beats: sequence.beats.map((beat) => (beat.id === beatId ? { ...beat, ...patch } : beat)),
          }
        : sequence,
    ),
    updatedAt: new Date().toISOString(),
  })
}

function splitLines(value: string) {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function downloadJson(fileName: string, payload: unknown) {
  const file = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8',
  })
  const url = URL.createObjectURL(file)
  const link = document.createElement('a')

  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

type MetricCardProps = { label: string; value: string }

function MetricCard({ label, value }: MetricCardProps) {
  return (
    <div className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

type FieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  type?: 'text' | 'number'
}

function Field({ label, value, onChange, type = 'text' }: FieldProps) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  )
}

type TextAreaProps = {
  label: string
  value: string
  onChange: (value: string) => void
}

function TextArea({ label, value, onChange }: TextAreaProps) {
  return (
    <label className="field field-textarea">
      <span>{label}</span>
      <textarea rows={5} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  )
}

export default App
