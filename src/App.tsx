import { useMemo, useRef, useState, type ChangeEvent } from 'react'
import {
  exportProjectPackage,
  formatDuration,
  parseProjectPackage,
  slugify,
  type ComicBookVideoProjectPackage,
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

  const addSequence = () => {
    updateProject((current) => {
      const sequence: MotionSequence = {
        id: crypto.randomUUID(),
        title: `Sequence ${current.scenes.length + 1}`,
        sourcePage: current.scenes.length + 1,
        sourcePanels: '1-3',
        runtimeSeconds: 10,
        motionPlan: 'Slow push, layered parallax, rain particles, caption fades.',
        narrationNotes: '',
        soundNotes: '',
      }

      return {
        ...current,
        scenes: [...current.scenes, sequence],
        updatedAt: new Date().toISOString(),
      }
    })
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

  const handleExport = () => exportProjectPackage(project)
  const handleImportClick = () => fileInputRef.current?.click()

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

  const metrics = useMemo(() => {
    const totalRuntime = project.scenes.reduce((sum, scene) => sum + scene.runtimeSeconds, 0)
    return {
      sequences: project.scenes.length,
      runtime: totalRuntime,
      deliverables: project.outputs.length,
      soundTargets: project.inputs.soundTargets.length,
    }
  }, [project])

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero-copy">
          <span className="eyebrow">Motion Comic Planner</span>
          <h1>Comic Book Video Generator</h1>
          <p>
            Convert a comic issue package into a motion-comic video plan with panel sequencing,
            narration beats, soundtrack notes, and delivery-ready timing structure.
          </p>
          <div className="hero-actions">
            <button onClick={handleExport}>Export Package</button>
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
          <MetricCard label="Outputs" value={String(metrics.deliverables)} />
          <MetricCard label="Sound Targets" value={String(metrics.soundTargets)} />
        </div>
      </header>

      <main className="workspace-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <span className="panel-kicker">Setup</span>
              <h2>Comic source and direction</h2>
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
          <TextArea
            label="Sound targets"
            value={project.inputs.soundTargets.join('\n')}
            onChange={(value) =>
              updateProject((current) => ({
                ...current,
                inputs: {
                  ...current.inputs,
                  soundTargets: value.split('\n').map((line) => line.trim()).filter(Boolean),
                },
                updatedAt: new Date().toISOString(),
              }))
            }
          />
          <TextArea
            label="Working notes"
            value={project.notes.join('\n')}
            onChange={(value) =>
              updateProject((current) => ({
                ...current,
                notes: value
                  .split('\n')
                  .map((line) => line.trim())
                  .filter(Boolean),
                updatedAt: new Date().toISOString(),
              }))
            }
          />
        </section>

        <section className="panel">
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
            {project.scenes.map((sequence, index) => (
              <article className="stack-card" key={sequence.id}>
                <div className="field-grid">
                  <Field
                    label="Sequence title"
                    value={sequence.title}
                    onChange={(value) =>
                      updateProject((current) => ({
                        ...current,
                        scenes: current.scenes.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, title: value } : item,
                        ),
                        updatedAt: new Date().toISOString(),
                      }))
                    }
                  />
                  <Field
                    label="Source page"
                    type="number"
                    value={String(sequence.sourcePage)}
                    onChange={(value) =>
                      updateProject((current) => ({
                        ...current,
                        scenes: current.scenes.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, sourcePage: Number(value) || 0 } : item,
                        ),
                        updatedAt: new Date().toISOString(),
                      }))
                    }
                  />
                  <Field
                    label="Source panels"
                    value={sequence.sourcePanels}
                    onChange={(value) =>
                      updateProject((current) => ({
                        ...current,
                        scenes: current.scenes.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, sourcePanels: value } : item,
                        ),
                        updatedAt: new Date().toISOString(),
                      }))
                    }
                  />
                  <Field
                    label="Runtime (seconds)"
                    type="number"
                    value={String(sequence.runtimeSeconds)}
                    onChange={(value) =>
                      updateProject((current) => ({
                        ...current,
                        scenes: current.scenes.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, runtimeSeconds: Number(value) || 0 }
                            : item,
                        ),
                        updatedAt: new Date().toISOString(),
                      }))
                    }
                  />
                </div>
                <TextArea
                  label="Motion and transition plan"
                  value={sequence.motionPlan}
                  onChange={(value) =>
                    updateProject((current) => ({
                      ...current,
                      scenes: current.scenes.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, motionPlan: value } : item,
                      ),
                      updatedAt: new Date().toISOString(),
                    }))
                  }
                />
                <div className="field-grid">
                  <TextArea
                    label="Narration notes"
                    value={sequence.narrationNotes}
                    onChange={(value) =>
                      updateProject((current) => ({
                        ...current,
                        scenes: current.scenes.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, narrationNotes: value } : item,
                        ),
                        updatedAt: new Date().toISOString(),
                      }))
                    }
                  />
                  <TextArea
                    label="Soundtrack and SFX notes"
                    value={sequence.soundNotes}
                    onChange={(value) =>
                      updateProject((current) => ({
                        ...current,
                        scenes: current.scenes.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, soundNotes: value } : item,
                        ),
                        updatedAt: new Date().toISOString(),
                      }))
                    }
                  />
                </div>
              </article>
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
                <div className="stack-header">
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

type MetricCardProps = {
  label: string
  value: string
}

function MetricCard({ label, value }: MetricCardProps) {
  return (
    <div className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

export default App
