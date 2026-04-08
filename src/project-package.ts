export type MotionSequence = {
  id: string
  title: string
  sourcePage: number
  sourcePanels: string
  runtimeSeconds: number
  motionPlan: string
  narrationNotes: string
  soundNotes: string
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
    soundTargets: string[]
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
  }[]
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function createComicBookVideoProject(
  title: string,
  partial?: Partial<ComicBookVideoProjectPackage>,
): ComicBookVideoProjectPackage {
  const now = new Date().toISOString()
  return {
    formatVersion: 'creative-project-package-v1',
    projectType: 'comic-book-video',
    title,
    slug: slugify(title),
    summary: '',
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    inputs: {
      targetFormat: '16:9 motion comic',
      narrationStrategy: '',
      soundTargets: [],
    },
    scenes: [],
    assets: [],
    prompts: [],
    outputs: [],
    metrics: {},
    notes: [],
    ...partial,
  }
}

export function parseProjectPackage(raw: string): ComicBookVideoProjectPackage {
  const parsed = JSON.parse(raw) as Partial<ComicBookVideoProjectPackage> & Partial<ImportedComicBookPackage>

  if (parsed.formatVersion !== 'creative-project-package-v1') {
    throw new Error('Expected creative-project-package-v1.')
  }

  if (parsed.projectType === 'comic-book-video') {
    return createComicBookVideoProject(parsed.title ?? 'Imported Motion Comic Project', {
      ...parsed,
      inputs: {
        targetFormat: '16:9 motion comic',
        narrationStrategy: '',
        soundTargets: [],
        ...(parsed.inputs ?? {}),
      },
      scenes: Array.isArray(parsed.scenes) ? (parsed.scenes as MotionSequence[]) : [],
      assets: Array.isArray(parsed.assets) ? parsed.assets : [],
      prompts: Array.isArray(parsed.prompts) ? parsed.prompts : [],
      outputs: Array.isArray(parsed.outputs) ? parsed.outputs : [],
      metrics: parsed.metrics ?? {},
      notes: Array.isArray(parsed.notes) ? parsed.notes : [],
    })
  }

  if (parsed.projectType === 'comic-book') {
    const sourceScenes = Array.isArray((parsed as ImportedComicBookPackage).scenes)
      ? ((parsed as ImportedComicBookPackage).scenes ?? [])
      : []
    return createComicBookVideoProject(`${parsed.title ?? 'Imported Comic'} Motion Plan`, {
      summary: parsed.summary ?? '',
      scenes: sourceScenes.map((scene, index) => ({
        id: crypto.randomUUID(),
        title: scene.title ?? `Sequence ${index + 1}`,
        sourcePage: scene.pageNumber ?? index + 1,
        sourcePanels: `1-${scene.panelCount ?? 1}`,
        runtimeSeconds: Math.max(6, (scene.panelCount ?? 1) * 2),
        motionPlan: scene.summary ?? 'Translate the page beat into camera and panel movement.',
        narrationNotes: '',
        soundNotes: '',
      })),
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
