import { useMemo, useRef, useState, type ChangeEvent } from 'react'
import {
  exportProjectPackage,
  formatDuration,
  parseProjectPackage,
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
  const [importMessage, setImportMessage] = useState('Ready')
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
      setImportMessage('Copied package JSON')
    } catch (error) {
      setImportMessage(
        error instanceof Error ? error.message : 'Copy failed. Check browser clipboard permissions.',
      )
    }
  }

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    try {
      const text = await file.text()
      persist(parseProjectPackage(text))
      setImportMessage(`Imported ${file.name}`)
    } catch (error) {
      setImportMessage(
        error instanceof Error ? error.message : 'Import failed. Check the JSON package.',
      )
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
              Import Package
            </button>
            <button
              className="ghost"
              onClick={() => {
                persist(sampleComicBookVideoProject)
                setImportMessage('Sample project loaded')
              }}
            >
              Load Sample
            </button>
          </div>
          <p className="helper-text">{importMessage}</p>
        </div>
        <div className="metric-grid">
          <MetricCard label="Sequences" value={String(metrics.sequences)} />
          <MetricCard label="Runtime" value={formatDuration(metrics.runtime)} />
          <MetricCard label="Beat Blocks" value={String(metrics.beats)} />
          <MetricCard label="Outputs" value={String(metrics.outputs)} />
        </div>
      </header>

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
                onAddBeat={() => addBeat(sequence.id)}
                onUpdateBeat={(beatId, patch) => updateBeat(project, sequence.id, beatId, persist, patch)}
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
        accept="application/json"
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
  onAddBeat: () => void
  onUpdateBeat: (beatId: string, patch: Partial<MotionBeat>) => void
}

function SequenceEditor({
  sequence,
  sequenceIndex,
  onChange,
  onRemove,
  onAddBeat,
  onUpdateBeat,
}: SequenceEditorProps) {
  return (
    <article className="stack-card cinematic-card">
      <div className="stack-header">
        <div>
          <strong>{sequence.title}</strong>
          <p className="card-caption">Sequence {sequenceIndex + 1}</p>
        </div>
        <div className="inline-actions">
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
        {sequence.beats.map((beat) => (
          <div className="shot-card" key={beat.id}>
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
