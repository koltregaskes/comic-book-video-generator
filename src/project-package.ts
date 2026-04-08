export type MotionBeat = {
  id: string
  label: string
  sourcePanel: string
  durationSeconds: number
  movement: string
  captionOverlay: string
  narration: string
  soundCue: string
}

export type MotionSequence = {
  id: string
  title: string
  sourcePage: number
  sourcePanels: string
  runtimeSeconds: number
  transitionIn: string
  transitionOut: string
  motionPlan: string
  narrationNotes: string
  soundNotes: string
  beats: MotionBeat[]
}

export type ComicBookVideoProjectPackage = {
  formatVersion: 'creative-project-package-v1'
  projectType: 'comic-book-video'
  title: string
  slug: string
  summary: string
  status: string
  createdAt: string
  updatedAt: string
  inputs: {
    targetFormat: string
    narrationStrategy: string
    voiceTone: string
    editRhythm: string
    soundTargets: string[]
    deliverySurfaces: string[]
  }
  scenes: MotionSequence[]
  assets: { id: string; label: string; type: string; status: string; notes: string }[]
  prompts: unknown[]
  outputs: { id: string; label: string; status: string; target: string }[]
  metrics: Record<string, unknown>
  notes: string[]
}

type ImportedComicBookPackage = {
  formatVersion: 'creative-project-package-v1'
  projectType: 'comic-book'
  title: string
  slug: string
  summary: string
  scenes?: {
    pageNumber?: number
    title?: string
    panelCount?: number
    summary?: string
    panels?: {
      panelNumber?: number
      action?: string
      caption?: string
      dialogue?: string
      prompt?: string
    }[]
  }[]
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function normalizeList(value: unknown) {
  return Array.isArray(value)
    ? value.map((item) => String(item).trim()).filter(Boolean)
    : []
}

function createBeat(partial?: Partial<MotionBeat>): MotionBeat {
  return {
    id: partial?.id ?? crypto.randomUUID(),
    label: partial?.label ?? 'Beat',
    sourcePanel: partial?.sourcePanel ?? '',
    durationSeconds: partial?.durationSeconds ?? 4,
    movement: partial?.movement ?? '',
    captionOverlay: partial?.captionOverlay ?? '',
    narration: partial?.narration ?? '',
    soundCue: partial?.soundCue ?? '',
  }
}

function createSequence(partial?: Partial<MotionSequence>): MotionSequence {
  const beats = Array.isArray(partial?.beats) ? partial.beats.map((beat) => createBeat(beat)) : []

  return {
    id: partial?.id ?? crypto.randomUUID(),
    title: partial?.title ?? 'Sequence',
    sourcePage: partial?.sourcePage ?? 1,
    sourcePanels: partial?.sourcePanels ?? '',
    runtimeSeconds: partial?.runtimeSeconds ?? 10,
    transitionIn: partial?.transitionIn ?? '',
    transitionOut: partial?.transitionOut ?? '',
    motionPlan: partial?.motionPlan ?? '',
    narrationNotes: partial?.narrationNotes ?? '',
    soundNotes: partial?.soundNotes ?? '',
    beats,
  }
}

export function createComicBookVideoProject(
  title: string,
  partial?: Partial<ComicBookVideoProjectPackage>,
): ComicBookVideoProjectPackage {
  const now = new Date().toISOString()
  const nextTitle = partial?.title ?? title

  return {
    formatVersion: 'creative-project-package-v1',
    projectType: 'comic-book-video',
    title: nextTitle,
    slug: partial?.slug ?? slugify(nextTitle),
    summary: partial?.summary ?? '',
    status: partial?.status ?? 'draft',
    createdAt: partial?.createdAt ?? now,
    updatedAt: partial?.updatedAt ?? now,
    inputs: {
      targetFormat: partial?.inputs?.targetFormat ?? '16:9 motion comic',
      narrationStrategy: partial?.inputs?.narrationStrategy ?? '',
      voiceTone: partial?.inputs?.voiceTone ?? '',
      editRhythm: partial?.inputs?.editRhythm ?? '',
      soundTargets: normalizeList(partial?.inputs?.soundTargets),
      deliverySurfaces: normalizeList(partial?.inputs?.deliverySurfaces),
    },
    scenes: Array.isArray(partial?.scenes)
      ? partial.scenes.map((sequence) => createSequence(sequence))
      : [],
    assets: Array.isArray(partial?.assets) ? partial.assets : [],
    prompts: Array.isArray(partial?.prompts) ? partial.prompts : [],
    outputs: Array.isArray(partial?.outputs) ? partial.outputs : [],
    metrics: partial?.metrics ?? {},
    notes: normalizeList(partial?.notes),
  }
}

export function parseProjectPackage(raw: string): ComicBookVideoProjectPackage {
  const parsed = JSON.parse(raw) as Partial<ComicBookVideoProjectPackage> & Partial<ImportedComicBookPackage>

  if (parsed.formatVersion !== 'creative-project-package-v1') {
    throw new Error('Expected creative-project-package-v1.')
  }

  if (parsed.projectType === 'comic-book-video') {
    return createComicBookVideoProject(parsed.title ?? 'Imported Motion Comic Project', parsed)
  }

  if (parsed.projectType === 'comic-book') {
    const sourceScenes = Array.isArray((parsed as ImportedComicBookPackage).scenes)
      ? ((parsed as ImportedComicBookPackage).scenes ?? [])
      : []

    return createComicBookVideoProject(`${parsed.title ?? 'Imported Comic'} Motion Plan`, {
      summary: parsed.summary ?? '',
      scenes: sourceScenes.map((scene, index) =>
        createSequence({
          title: scene.title ?? `Sequence ${index + 1}`,
          sourcePage: scene.pageNumber ?? index + 1,
          sourcePanels: `1-${scene.panelCount ?? scene.panels?.length ?? 1}`,
          runtimeSeconds: Math.max(8, (scene.panelCount ?? scene.panels?.length ?? 1) * 3),
          motionPlan: scene.summary ?? 'Translate the page beat into camera and panel movement.',
          beats: Array.isArray(scene.panels)
            ? scene.panels.map((panel, panelIndex) =>
                createBeat({
                  label: `Panel ${panel.panelNumber ?? panelIndex + 1}`,
                  sourcePanel: String(panel.panelNumber ?? panelIndex + 1),
                  durationSeconds: 4,
                  movement: panel.action ?? '',
                  captionOverlay: panel.caption ?? '',
                  narration: panel.dialogue ?? '',
                  soundCue: '',
                }),
              )
            : [],
        }),
      ),
      notes: ['Imported from a comic-book package.'],
    })
  }

  throw new Error('Expected a comic-book-video or comic-book creative-project-package-v1 file.')
}

export function exportProjectPackage(project: ComicBookVideoProjectPackage) {
  const file = new Blob([JSON.stringify(project, null, 2)], {
    type: 'application/json;charset=utf-8',
  })
  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = `${project.slug || 'comic-book-video-project'}.json`
  link.click()
  URL.revokeObjectURL(url)
}

export function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const remainder = String(seconds % 60).padStart(2, '0')
  return `${minutes}:${remainder}`
}
