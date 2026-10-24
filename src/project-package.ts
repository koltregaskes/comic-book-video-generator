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
  createdAt?: string
  updatedAt?: string
  scenes?: {
    id?: string
    pageNumber?: number
    title?: string
    panelCount?: number
    summary?: string
    turnMoment?: string
    panels?: {
      id?: string
      panelNumber?: number
      action?: string
      caption?: string
      dialogue?: string
      prompt?: string
    }[]
  }[]
}

type JsonRecord = Record<string, unknown>

export type ComicVideoImportPanel = {
  id: string
  panelNumber: number
  action: string
  prompt: string
  dialogue: string
  caption: string
}

export type ComicVideoImportPage = {
  id: string
  pageNumber: number
  title: string
  turnMoment: string
  panelCount: number
  panels: ComicVideoImportPanel[]
}

export type ComicVideoImportPayload = {
  pageCount: number
  panelCount: number
  pages: ComicVideoImportPage[]
}

type ImportedComicSourceProject = {
  title: string
  slug: string
  status: string
  updatedAt: string
  issueNumber: number
  seriesTitle: string
}

type ImportedVideoOutput = ComicBookVideoProjectPackage['outputs'][number]

export type TimelineIssueSeverity = 'warning' | 'error'

export type TimelineIssueCode =
  | 'duplicate-sequence-id'
  | 'duplicate-beat-id'
  | 'non-positive-sequence-duration'
  | 'non-positive-beat-duration'
  | 'beat-duration-gap'
  | 'beat-duration-overflow'

export type TimelineConsistencyIssue = {
  id: string
  severity: TimelineIssueSeverity
  code: TimelineIssueCode
  sequenceId?: string
  beatId?: string
  summary: string
}

export type TimelineConsistencyReport = {
  cutReady: boolean
  totalRuntimeSeconds: number
  totalBeatSeconds: number
  totalGapSeconds: number
  totalOverflowSeconds: number
  issueCount: number
  issues: TimelineConsistencyIssue[]
}

export type CutReadyTimelineBeat = {
  id: string
  sequenceId: string
  sequenceTitle: string
  label: string
  sourcePanel: string
  startSeconds: number
  endSeconds: number
  durationSeconds: number
  movement: string
  captionOverlay: string
  narration: string
  soundCue: string
}

export type CutReadyTimelineSequence = {
  id: string
  order: number
  title: string
  sourcePage: number
  sourcePanels: string
  startSeconds: number
  endSeconds: number
  runtimeSeconds: number
  beatSeconds: number
  gapSeconds: number
  overflowSeconds: number
  transitionIn: string
  transitionOut: string
  beats: CutReadyTimelineBeat[]
}

export type NarrationCue = {
  id: string
  sequenceId: string
  beatId: string
  sequenceTitle: string
  beatLabel: string
  sourcePanel: string
  startSeconds: number
  endSeconds: number
  narration: string
  captionOverlay: string
}

export type SfxCue = {
  id: string
  sequenceId: string
  beatId: string
  sequenceTitle: string
  beatLabel: string
  sourcePanel: string
  startSeconds: number
  endSeconds: number
  soundCue: string
  movement: string
}

export type RenderHandoffManifest = {
  formatVersion: 'comic-video-render-handoff-v1'
  generatedAt: string
  project: {
    title: string
    slug: string
    status: string
    targetFormat: string
    totalRuntimeSeconds: number
    totalSequences: number
    totalBeats: number
    cutReady: boolean
  }
  consistency: TimelineConsistencyReport
  timeline: CutReadyTimelineSequence[]
  narrationScript: NarrationCue[]
  sfxCueList: SfxCue[]
  outputs: ComicBookVideoProjectPackage['outputs']
  notes: string[]
}

export type RenderOrchestrationIssueCode =
  | 'manifest-not-cut-ready'
  | 'missing-motion-direction'
  | 'missing-narration-or-caption'
  | 'missing-sound-cue'
  | 'missing-delivery-output'
  | 'missing-output-target'

export type RenderOrchestrationIssue = {
  id: string
  severity: TimelineIssueSeverity
  code: RenderOrchestrationIssueCode
  sequenceId?: string
  beatId?: string
  outputId?: string
  summary: string
}

export type RenderOrchestrationTaskStatus = 'ready' | 'needs-review'

export type RenderOrchestrationTask = {
  id: string
  label: string
  status: RenderOrchestrationTaskStatus
  sequenceId?: string
  beatId?: string
  startSeconds?: number
  endSeconds?: number
  instructions: string[]
  inputs: string[]
  outputs: string[]
}

export type RenderOrchestrationPass = {
  id: string
  label: string
  stage: 'preflight' | 'shot-assembly' | 'audio' | 'delivery'
  status: RenderOrchestrationTaskStatus
  taskCount: number
  tasks: RenderOrchestrationTask[]
}

export type RenderOrchestrationPlan = {
  formatVersion: 'comic-video-render-orchestration-v1'
  generatedAt: string
  mediaGenerated: false
  externalConnectorRequired: false
  sourceManifest: {
    formatVersion: RenderHandoffManifest['formatVersion']
    generatedAt: string
    projectSlug: string
    cutReady: boolean
  }
  readiness: {
    goNoGo: 'GO' | 'NO-GO'
    percentComplete: number
    errorCount: number
    warningCount: number
    issueCount: number
    summary: string
  }
  issues: RenderOrchestrationIssue[]
  passes: RenderOrchestrationPass[]
  notes: string[]
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

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function requireRecord(value: unknown, label: string): JsonRecord {
  if (!isRecord(value)) {
    throw new Error(`${label} must be an object.`)
  }

  return value
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== 'string') {
    throw new Error(`${label} must be a string.`)
  }

  return value
}

function optionalString(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function requireNonNegativeInteger(value: unknown, label: string): number {
  if (!Number.isInteger(value) || Number(value) < 0) {
    throw new Error(`${label} must be a non-negative integer.`)
  }

  return Number(value)
}

function requirePositiveInteger(value: unknown, label: string): number {
  if (!Number.isInteger(value) || Number(value) < 1) {
    throw new Error(`${label} must be a positive integer.`)
  }

  return Number(value)
}

function requireArray(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array.`)
  }

  return value
}

function stableImportId(prefix: string, ...parts: unknown[]) {
  const suffix = parts
    .map((part) => slugify(String(part ?? '')))
    .filter(Boolean)
    .join('-')

  return suffix ? `${prefix}-${suffix}` : prefix
}

function sourcePanelRange(panels: ComicVideoImportPanel[]) {
  if (panels.length === 0) {
    return ''
  }

  const panelNumbers = panels.map((panel) => panel.panelNumber)
  const isConsecutive = panelNumbers.every(
    (panelNumber, index) => index === 0 || panelNumber === panelNumbers[index - 1] + 1,
  )

  return isConsecutive
    ? `${panelNumbers[0]}-${panelNumbers[panelNumbers.length - 1]}`
    : panelNumbers.join(', ')
}

function normalizedSeconds(value: number) {
  return Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0
}

function hasText(value: string) {
  return value.trim().length > 0
}

function duplicateIds(items: { id: string }[]) {
  const seen = new Set<string>()
  const duplicates = new Set<string>()

  items.forEach((item) => {
    if (seen.has(item.id)) {
      duplicates.add(item.id)
    }

    seen.add(item.id)
  })

  return [...duplicates]
}

function validateTimelineOrderIds(currentIds: string[], requestedIds: string[], label: string) {
  const duplicates = requestedIds.filter((id, index) => requestedIds.indexOf(id) !== index)
  if (duplicates.length > 0) {
    throw new Error(`${label} order contains duplicate ID "${duplicates[0]}".`)
  }

  const currentIdSet = new Set(currentIds)
  const requestedIdSet = new Set(requestedIds)
  const missingIds = currentIds.filter((id) => !requestedIdSet.has(id))
  const unknownIds = requestedIds.filter((id) => !currentIdSet.has(id))

  if (missingIds.length > 0 || unknownIds.length > 0) {
    const missing = missingIds.length > 0 ? ` Missing: ${missingIds.join(', ')}.` : ''
    const unknown = unknownIds.length > 0 ? ` Unknown: ${unknownIds.join(', ')}.` : ''
    throw new Error(`${label} order must include each existing ${label} exactly once.${missing}${unknown}`)
  }
}

export function validateComicVideoImportPayload(value: unknown): ComicVideoImportPayload {
  const payload = requireRecord(value, 'comicVideoImport')
  const pageCount = requireNonNegativeInteger(payload.pageCount, 'comicVideoImport.pageCount')
  const panelCount = requireNonNegativeInteger(payload.panelCount, 'comicVideoImport.panelCount')
  const pages = requireArray(payload.pages, 'comicVideoImport.pages').map((pageValue, pageIndex) => {
    const pageLabel = `comicVideoImport.pages[${pageIndex}]`
    const page = requireRecord(pageValue, pageLabel)
    const panels = requireArray(page.panels, `${pageLabel}.panels`).map((panelValue, panelIndex) => {
      const panelLabel = `${pageLabel}.panels[${panelIndex}]`
      const panel = requireRecord(panelValue, panelLabel)

      return {
        id: requireString(panel.id, `${panelLabel}.id`),
        panelNumber: requirePositiveInteger(panel.panelNumber, `${panelLabel}.panelNumber`),
        action: requireString(panel.action, `${panelLabel}.action`),
        prompt: requireString(panel.prompt, `${panelLabel}.prompt`),
        dialogue: requireString(panel.dialogue, `${panelLabel}.dialogue`),
        caption: requireString(panel.caption, `${panelLabel}.caption`),
      }
    })
    const declaredPanelCount = requireNonNegativeInteger(page.panelCount, `${pageLabel}.panelCount`)

    if (declaredPanelCount !== panels.length) {
      throw new Error(`${pageLabel}.panelCount must match its panels length.`)
    }

    return {
      id: requireString(page.id, `${pageLabel}.id`),
      pageNumber: requirePositiveInteger(page.pageNumber, `${pageLabel}.pageNumber`),
      title: requireString(page.title, `${pageLabel}.title`),
      turnMoment: requireString(page.turnMoment, `${pageLabel}.turnMoment`),
      panelCount: declaredPanelCount,
      panels,
    }
  })

  if (pageCount !== pages.length) {
    throw new Error('comicVideoImport.pageCount must match pages length.')
  }

  const actualPanelCount = pages.reduce((sum, page) => sum + page.panels.length, 0)
  if (panelCount !== actualPanelCount) {
    throw new Error('comicVideoImport.panelCount must match the total panel length.')
  }

  return { pageCount, panelCount, pages }
}

function validateComicSourceProject(value: unknown, label: string): ImportedComicSourceProject {
  const sourceProject = requireRecord(value, label)
  const formatVersion = requireString(sourceProject.formatVersion, `${label}.formatVersion`)
  const projectType = requireString(sourceProject.projectType, `${label}.projectType`)

  if (formatVersion !== 'creative-project-package-v1' || projectType !== 'comic-book') {
    throw new Error(`${label} must describe a comic-book creative-project-package-v1 source project.`)
  }

  return {
    title: requireString(sourceProject.title, `${label}.title`),
    slug: requireString(sourceProject.slug, `${label}.slug`),
    status: requireString(sourceProject.status, `${label}.status`),
    updatedAt: requireString(sourceProject.updatedAt, `${label}.updatedAt`),
    issueNumber: requirePositiveInteger(sourceProject.issueNumber, `${label}.issueNumber`),
    seriesTitle: requireString(sourceProject.seriesTitle, `${label}.seriesTitle`),
  }
}

function normalizeImportedOutputs(value: unknown, label: string): ImportedVideoOutput[] {
  if (value === undefined) {
    return []
  }

  return requireArray(value, label).map((outputValue, index) => {
    const outputLabel = `${label}[${index}]`
    const output = requireRecord(outputValue, outputLabel)
    const labelText = optionalString(output.label) || `Imported output ${index + 1}`

    return {
      id: optionalString(output.id) || stableImportId('import-output', index + 1, labelText),
      label: labelText,
      status: optionalString(output.status) || 'planned',
      target: optionalString(output.target) || optionalString(output.format) || 'Imported package artifact',
    }
  })
}

function normalizePublishingNotes(value: unknown) {
  const publishingHandoff = isRecord(value) ? value : {}

  return [
    ...normalizeList(publishingHandoff.reviewFocus),
    ...normalizeList(publishingHandoff.notes),
  ]
}

function sequenceFromComicVideoPage(page: ComicVideoImportPage): MotionSequence {
  return createSequence({
    id: stableImportId('import-page', page.id),
    title: page.title || `Page ${page.pageNumber}`,
    sourcePage: page.pageNumber,
    sourcePanels: sourcePanelRange(page.panels),
    runtimeSeconds: Math.max(8, page.panels.length * 4),
    transitionIn: page.pageNumber === 1 ? 'Open on source comic page art.' : 'Continue from previous page turn.',
    transitionOut: page.turnMoment || 'Cut on source page turn.',
    motionPlan: page.turnMoment
      ? `Build the sequence around this source turn moment: ${page.turnMoment}`
      : 'Translate the source page panels into camera and panel movement.',
    narrationNotes: 'Use imported dialogue and captions as narration candidates.',
    soundNotes: 'Derive SFX from panel action and visual-prompt ambience.',
    beats: page.panels.map((panel) =>
      createBeat({
        id: stableImportId('import-panel', page.id, panel.id),
        label: `Panel ${panel.panelNumber}`,
        sourcePanel: String(panel.panelNumber),
        durationSeconds: 4,
        movement: panel.action,
        captionOverlay: panel.caption,
        narration: panel.dialogue,
        soundCue: panel.prompt ? 'Reference source visual prompt for ambience.' : '',
      }),
    ),
  })
}

function createProjectFromComicVideoImport({
  artifactFormat,
  generatedAt,
  sourceProject,
  comicVideoImport,
  publishingHandoff,
}: {
  artifactFormat: 'comic-queue-handoff-v1' | 'comic-publishing-package-v1'
  generatedAt: string
  sourceProject: ImportedComicSourceProject
  comicVideoImport: ComicVideoImportPayload
  publishingHandoff: unknown
}): ComicBookVideoProjectPackage {
  const sourceIssue = `${sourceProject.seriesTitle || sourceProject.title} #${sourceProject.issueNumber}`
  const notes = [
    `Imported from ${artifactFormat}.`,
    `Source issue: ${sourceIssue}.`,
    `Source status: ${sourceProject.status}.`,
    ...normalizePublishingNotes(publishingHandoff),
  ]

  return createComicBookVideoProject(`${sourceProject.title} Motion Plan`, {
    slug: stableImportId(sourceProject.slug || slugify(sourceProject.title), 'motion-plan'),
    summary: `Motion-comic plan imported from ${artifactFormat} with ${comicVideoImport.pageCount} page sequence${comicVideoImport.pageCount === 1 ? '' : 's'} and ${comicVideoImport.panelCount} panel beat${comicVideoImport.panelCount === 1 ? '' : 's'}.`,
    status: 'draft',
    createdAt: sourceProject.updatedAt,
    updatedAt: generatedAt,
    inputs: {
      targetFormat: '16:9 motion comic',
      narrationStrategy: 'Use imported dialogue and captions as narration candidates.',
      voiceTone: 'Match the source comic tone.',
      editRhythm: 'One timed motion sequence per source comic page.',
      soundTargets: ['Panel action SFX', 'Visual prompt ambience'],
      deliverySurfaces: ['Motion-comic edit handoff'],
    },
    scenes: comicVideoImport.pages.map(sequenceFromComicVideoPage),
    outputs: normalizeImportedOutputs(
      isRecord(publishingHandoff) ? publishingHandoff.outputs : undefined,
      'publishingHandoff.outputs',
    ),
    notes,
  })
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

export function reorderProjectSequences(
  project: ComicBookVideoProjectPackage,
  sequenceIds: string[],
): ComicBookVideoProjectPackage {
  validateTimelineOrderIds(
    project.scenes.map((sequence) => sequence.id),
    sequenceIds,
    'sequence',
  )

  const sequenceById = new Map(project.scenes.map((sequence) => [sequence.id, sequence]))

  return {
    ...project,
    scenes: sequenceIds.map((sequenceId) => sequenceById.get(sequenceId)).filter(Boolean) as MotionSequence[],
  }
}

export function reorderSequenceBeats(
  project: ComicBookVideoProjectPackage,
  sequenceId: string,
  beatIds: string[],
): ComicBookVideoProjectPackage {
  const targetSequence = project.scenes.find((sequence) => sequence.id === sequenceId)

  if (!targetSequence) {
    throw new Error(`Cannot reorder beats for missing sequence "${sequenceId}".`)
  }

  validateTimelineOrderIds(
    targetSequence.beats.map((beat) => beat.id),
    beatIds,
    'beat',
  )

  const beatById = new Map(targetSequence.beats.map((beat) => [beat.id, beat]))

  return {
    ...project,
    scenes: project.scenes.map((sequence) =>
      sequence.id === sequenceId
        ? {
            ...sequence,
            beats: beatIds.map((beatId) => beatById.get(beatId)).filter(Boolean) as MotionBeat[],
          }
        : sequence,
    ),
  }
}

export function createCutReadyTimeline(project: ComicBookVideoProjectPackage): CutReadyTimelineSequence[] {
  let cursorSeconds = 0

  return project.scenes.map((sequence, index) => {
    const runtimeSeconds = normalizedSeconds(sequence.runtimeSeconds)
    const startSeconds = cursorSeconds
    const beats: CutReadyTimelineBeat[] = []
    let beatCursorSeconds = startSeconds

    sequence.beats.forEach((beat) => {
      const durationSeconds = normalizedSeconds(beat.durationSeconds)
      const endSeconds = beatCursorSeconds + durationSeconds

      beats.push({
        id: beat.id,
        sequenceId: sequence.id,
        sequenceTitle: sequence.title || `Sequence ${index + 1}`,
        label: beat.label,
        sourcePanel: beat.sourcePanel,
        startSeconds: beatCursorSeconds,
        endSeconds,
        durationSeconds,
        movement: beat.movement,
        captionOverlay: beat.captionOverlay,
        narration: beat.narration,
        soundCue: beat.soundCue,
      })

      beatCursorSeconds = endSeconds
    })

    const beatSeconds = beats.reduce((sum, beat) => sum + beat.durationSeconds, 0)
    const endSeconds = startSeconds + runtimeSeconds
    const gapSeconds = Math.max(0, runtimeSeconds - beatSeconds)
    const overflowSeconds = Math.max(0, beatSeconds - runtimeSeconds)

    cursorSeconds = endSeconds

    return {
      id: sequence.id,
      order: index + 1,
      title: sequence.title || `Sequence ${index + 1}`,
      sourcePage: sequence.sourcePage,
      sourcePanels: sequence.sourcePanels,
      startSeconds,
      endSeconds,
      runtimeSeconds,
      beatSeconds,
      gapSeconds,
      overflowSeconds,
      transitionIn: sequence.transitionIn,
      transitionOut: sequence.transitionOut,
      beats,
    }
  })
}

export function analyseTimelineConsistency(project: ComicBookVideoProjectPackage): TimelineConsistencyReport {
  const timeline = createCutReadyTimeline(project)
  const issues: TimelineConsistencyIssue[] = []

  duplicateIds(project.scenes).forEach((sequenceId) => {
    issues.push({
      id: `duplicate-sequence-${sequenceId}`,
      severity: 'error',
      code: 'duplicate-sequence-id',
      sequenceId,
      summary: `Sequence ID "${sequenceId}" is duplicated.`,
    })
  })

  project.scenes.forEach((sequence, sequenceIndex) => {
    duplicateIds(sequence.beats).forEach((beatId) => {
      issues.push({
        id: `duplicate-beat-${sequence.id}-${beatId}`,
        severity: 'error',
        code: 'duplicate-beat-id',
        sequenceId: sequence.id,
        beatId,
        summary: `Beat ID "${beatId}" is duplicated in sequence "${sequence.title || sequenceIndex + 1}".`,
      })
    })

    if (!Number.isFinite(sequence.runtimeSeconds) || sequence.runtimeSeconds <= 0) {
      issues.push({
        id: `non-positive-sequence-${sequence.id}`,
        severity: 'error',
        code: 'non-positive-sequence-duration',
        sequenceId: sequence.id,
        summary: `Sequence "${sequence.title || sequenceIndex + 1}" needs a positive runtime.`,
      })
    }

    sequence.beats.forEach((beat, beatIndex) => {
      if (!Number.isFinite(beat.durationSeconds) || beat.durationSeconds <= 0) {
        issues.push({
          id: `non-positive-beat-${sequence.id}-${beat.id}`,
          severity: 'error',
          code: 'non-positive-beat-duration',
          sequenceId: sequence.id,
          beatId: beat.id,
          summary: `Beat "${beat.label || beatIndex + 1}" needs a positive duration.`,
        })
      }
    })
  })

  timeline.forEach((sequence) => {
    if (sequence.gapSeconds > 0) {
      issues.push({
        id: `gap-${sequence.id}`,
        severity: 'warning',
        code: 'beat-duration-gap',
        sequenceId: sequence.id,
        summary: `Sequence "${sequence.title}" has ${sequence.gapSeconds} unassigned second${sequence.gapSeconds === 1 ? '' : 's'}.`,
      })
    }

    if (sequence.overflowSeconds > 0) {
      issues.push({
        id: `overflow-${sequence.id}`,
        severity: 'error',
        code: 'beat-duration-overflow',
        sequenceId: sequence.id,
        summary: `Sequence "${sequence.title}" has ${sequence.overflowSeconds} beat second${sequence.overflowSeconds === 1 ? '' : 's'} beyond its runtime.`,
      })
    }
  })

  const totalRuntimeSeconds = timeline.reduce((sum, sequence) => sum + sequence.runtimeSeconds, 0)
  const totalBeatSeconds = timeline.reduce((sum, sequence) => sum + sequence.beatSeconds, 0)
  const totalGapSeconds = timeline.reduce((sum, sequence) => sum + sequence.gapSeconds, 0)
  const totalOverflowSeconds = timeline.reduce((sum, sequence) => sum + sequence.overflowSeconds, 0)

  return {
    cutReady: issues.length === 0,
    totalRuntimeSeconds,
    totalBeatSeconds,
    totalGapSeconds,
    totalOverflowSeconds,
    issueCount: issues.length,
    issues,
  }
}

export function createRenderHandoffManifest(
  project: ComicBookVideoProjectPackage,
  generatedAt = project.updatedAt || project.createdAt,
): RenderHandoffManifest {
  const timeline = createCutReadyTimeline(project)
  const consistency = analyseTimelineConsistency(project)
  const allBeats = timeline.flatMap((sequence) => sequence.beats)

  return {
    formatVersion: 'comic-video-render-handoff-v1',
    generatedAt,
    project: {
      title: project.title,
      slug: project.slug,
      status: project.status,
      targetFormat: project.inputs.targetFormat,
      totalRuntimeSeconds: consistency.totalRuntimeSeconds,
      totalSequences: timeline.length,
      totalBeats: allBeats.length,
      cutReady: consistency.cutReady,
    },
    consistency,
    timeline,
    narrationScript: allBeats
      .filter((beat) => beat.narration.trim() || beat.captionOverlay.trim())
      .map((beat) => ({
        id: `narration-${beat.id}`,
        sequenceId: beat.sequenceId,
        beatId: beat.id,
        sequenceTitle: beat.sequenceTitle,
        beatLabel: beat.label,
        sourcePanel: beat.sourcePanel,
        startSeconds: beat.startSeconds,
        endSeconds: beat.endSeconds,
        narration: beat.narration,
        captionOverlay: beat.captionOverlay,
      })),
    sfxCueList: allBeats
      .filter((beat) => beat.soundCue.trim())
      .map((beat) => ({
        id: `sfx-${beat.id}`,
        sequenceId: beat.sequenceId,
        beatId: beat.id,
        sequenceTitle: beat.sequenceTitle,
        beatLabel: beat.label,
        sourcePanel: beat.sourcePanel,
        startSeconds: beat.startSeconds,
        endSeconds: beat.endSeconds,
        soundCue: beat.soundCue,
        movement: beat.movement,
      })),
    outputs: project.outputs,
    notes: project.notes,
  }
}

function taskStatus(hasIssue: boolean): RenderOrchestrationTaskStatus {
  return hasIssue ? 'needs-review' : 'ready'
}

function passStatus(tasks: RenderOrchestrationTask[]): RenderOrchestrationTaskStatus {
  return tasks.some((task) => task.status === 'needs-review') ? 'needs-review' : 'ready'
}

function createRenderOrchestrationIssues(
  project: ComicBookVideoProjectPackage,
  manifest: RenderHandoffManifest,
): RenderOrchestrationIssue[] {
  const issues: RenderOrchestrationIssue[] = []

  if (!manifest.consistency.cutReady) {
    issues.push({
      id: 'manifest-not-cut-ready',
      severity: 'error',
      code: 'manifest-not-cut-ready',
      summary: 'Timeline manifest must be cut-ready before orchestration can be handed to a renderer.',
    })
  }

  manifest.timeline.forEach((sequence) => {
    sequence.beats.forEach((beat) => {
      if (!hasText(beat.movement)) {
        issues.push({
          id: `missing-motion-${beat.id}`,
          severity: 'error',
          code: 'missing-motion-direction',
          sequenceId: sequence.id,
          beatId: beat.id,
          summary: `Beat "${beat.label}" needs motion direction before shot assembly.`,
        })
      }

      if (!hasText(beat.narration) && !hasText(beat.captionOverlay)) {
        issues.push({
          id: `missing-voice-caption-${beat.id}`,
          severity: 'warning',
          code: 'missing-narration-or-caption',
          sequenceId: sequence.id,
          beatId: beat.id,
          summary: `Beat "${beat.label}" has no narration or caption cue.`,
        })
      }

      if (!hasText(beat.soundCue)) {
        issues.push({
          id: `missing-sfx-${beat.id}`,
          severity: 'warning',
          code: 'missing-sound-cue',
          sequenceId: sequence.id,
          beatId: beat.id,
          summary: `Beat "${beat.label}" has no sound cue.`,
        })
      }
    })
  })

  if (project.outputs.length === 0) {
    issues.push({
      id: 'missing-delivery-output',
      severity: 'error',
      code: 'missing-delivery-output',
      summary: 'At least one delivery output is needed before orchestration handoff.',
    })
  }

  project.outputs.forEach((output) => {
    if (!hasText(output.target)) {
      issues.push({
        id: `missing-output-target-${output.id}`,
        severity: 'warning',
        code: 'missing-output-target',
        outputId: output.id,
        summary: `Output "${output.label || output.id}" needs a delivery target.`,
      })
    }
  })

  return issues
}

export function createRenderOrchestrationPlan(
  project: ComicBookVideoProjectPackage,
  generatedAt = project.updatedAt || project.createdAt,
): RenderOrchestrationPlan {
  const manifest = createRenderHandoffManifest(project, generatedAt)
  const issues = createRenderOrchestrationIssues(project, manifest)
  const hasIssueFor = (beatId: string, severity?: TimelineIssueSeverity) =>
    issues.some((issue) => issue.beatId === beatId && (!severity || issue.severity === severity))
  const errorCount = issues.filter((issue) => issue.severity === 'error').length
  const warningCount = issues.filter((issue) => issue.severity === 'warning').length
  const percentComplete = Math.max(0, Math.min(100, 100 - errorCount * 25 - warningCount * 5))
  const goNoGo = errorCount === 0 ? 'GO' : 'NO-GO'

  const preflightTasks: RenderOrchestrationTask[] = [
    {
      id: 'preflight-timeline-manifest',
      label: 'Validate timeline manifest',
      status: taskStatus(!manifest.consistency.cutReady),
      instructions: [
        'Confirm cumulative sequence windows, beat windows, and timeline issue counts before any render work starts.',
        'Keep this as a local planning handoff; no media generation or connector call is triggered.',
      ],
      inputs: ['comic-video-render-handoff-v1 manifest'],
      outputs: ['Approved local render queue or timing fixes'],
    },
  ]

  const shotTasks: RenderOrchestrationTask[] = manifest.timeline.flatMap((sequence) =>
    sequence.beats.map((beat) => ({
      id: `shot-${beat.id}`,
      label: `${sequence.order}.${beat.label}`,
      status: taskStatus(hasIssueFor(beat.id, 'error')),
      sequenceId: sequence.id,
      beatId: beat.id,
      startSeconds: beat.startSeconds,
      endSeconds: beat.endSeconds,
      instructions: [
        `Assemble source panel ${beat.sourcePanel} for ${formatDuration(beat.durationSeconds)}.`,
        beat.movement || 'Add motion direction before shot assembly.',
        beat.captionOverlay ? `Caption overlay: ${beat.captionOverlay}` : 'No caption overlay queued.',
      ],
      inputs: [`Sequence: ${sequence.title}`, `Source panel: ${beat.sourcePanel}`],
      outputs: [`Timed shot block ${formatDuration(beat.startSeconds)}-${formatDuration(beat.endSeconds)}`],
    })),
  )

  const audioTasks: RenderOrchestrationTask[] = [
    {
      id: 'audio-narration-cues',
      label: 'Prepare narration and caption cues',
      status: taskStatus(manifest.narrationScript.length === 0),
      instructions: [
        `Review ${manifest.narrationScript.length} narration/caption cue${manifest.narrationScript.length === 1 ? '' : 's'}.`,
        'Export cue timings for voiceover, subtitle, or editor use only.',
      ],
      inputs: ['narrationScript'],
      outputs: ['Narration/caption timing sheet'],
    },
    {
      id: 'audio-sfx-cues',
      label: 'Prepare soundtrack and SFX cues',
      status: taskStatus(manifest.sfxCueList.length === 0),
      instructions: [
        `Review ${manifest.sfxCueList.length} SFX cue${manifest.sfxCueList.length === 1 ? '' : 's'}.`,
        'Map cues to the editor timeline without calling an audio generation service.',
      ],
      inputs: ['sfxCueList'],
      outputs: ['Soundtrack/SFX timing sheet'],
    },
  ]

  const deliveryTasks: RenderOrchestrationTask[] = project.outputs.length
    ? project.outputs.map((output) => ({
        id: `delivery-${output.id}`,
        label: output.label || output.id,
        status: taskStatus(!hasText(output.target)),
        instructions: [
          `Prepare delivery package for ${output.target || 'an unspecified target'}.`,
          `Keep output status as "${output.status || 'planned'}" until a human or renderer confirms completion.`,
        ],
        inputs: ['Validated shot queue', 'Audio timing sheets', 'Project notes'],
        outputs: [output.target || 'Delivery target to be confirmed'],
      }))
    : [
        {
          id: 'delivery-missing-output',
          label: 'Define delivery output',
          status: 'needs-review',
          instructions: ['Add at least one output before this plan is actionable for a renderer.'],
          inputs: ['Project delivery surfaces'],
          outputs: ['Named output target'],
        },
      ]

  const passes: RenderOrchestrationPass[] = [
    {
      id: 'preflight',
      label: 'Preflight',
      stage: 'preflight',
      status: passStatus(preflightTasks),
      taskCount: preflightTasks.length,
      tasks: preflightTasks,
    },
    {
      id: 'shot-assembly',
      label: 'Shot assembly',
      stage: 'shot-assembly',
      status: passStatus(shotTasks),
      taskCount: shotTasks.length,
      tasks: shotTasks,
    },
    {
      id: 'audio',
      label: 'Audio and captions',
      stage: 'audio',
      status: passStatus(audioTasks),
      taskCount: audioTasks.length,
      tasks: audioTasks,
    },
    {
      id: 'delivery',
      label: 'Delivery packaging',
      stage: 'delivery',
      status: passStatus(deliveryTasks),
      taskCount: deliveryTasks.length,
      tasks: deliveryTasks,
    },
  ]

  return {
    formatVersion: 'comic-video-render-orchestration-v1',
    generatedAt,
    mediaGenerated: false,
    externalConnectorRequired: false,
    sourceManifest: {
      formatVersion: manifest.formatVersion,
      generatedAt: manifest.generatedAt,
      projectSlug: project.slug,
      cutReady: manifest.consistency.cutReady,
    },
    readiness: {
      goNoGo,
      percentComplete,
      errorCount,
      warningCount,
      issueCount: issues.length,
      summary:
        goNoGo === 'GO'
          ? 'Local render orchestration handoff is ready for a renderer/editor queue.'
          : 'Local render orchestration handoff needs fixes before renderer/editor queueing.',
    },
    issues,
    passes,
    notes: [
      'This is a local orchestration handoff only.',
      'No video, image, audio, publishing, connector, credential, or deploy action is performed by this package.',
      ...project.notes,
    ],
  }
}

export function parseProjectPackage(raw: string): ComicBookVideoProjectPackage {
  const parsed = JSON.parse(raw) as unknown
  const packageRecord = requireRecord(parsed, 'Imported package')

  if (packageRecord.formatVersion === 'comic-queue-handoff-v1') {
    const sourceProject = validateComicSourceProject(packageRecord.sourceProject, 'sourceProject')
    const comicVideoImport = validateComicVideoImportPayload(packageRecord.comicVideoImport)
    const generatedAt = requireString(packageRecord.generatedAt, 'generatedAt')

    return createProjectFromComicVideoImport({
      artifactFormat: 'comic-queue-handoff-v1',
      generatedAt,
      sourceProject,
      comicVideoImport,
      publishingHandoff: packageRecord.publishingHandoff,
    })
  }

  if (packageRecord.formatVersion === 'comic-publishing-package-v1') {
    const sourceProject = validateComicSourceProject(packageRecord.sourceProject, 'sourceProject')
    const comicVideoImport = validateComicVideoImportPayload(packageRecord.comicVideoImport)
    const generatedAt = requireString(packageRecord.generatedAt, 'generatedAt')

    return createProjectFromComicVideoImport({
      artifactFormat: 'comic-publishing-package-v1',
      generatedAt,
      sourceProject,
      comicVideoImport,
      publishingHandoff: packageRecord.publishingHandoff,
    })
  }

  if (packageRecord.formatVersion !== 'creative-project-package-v1') {
    throw new Error('Expected creative-project-package-v1, comic-queue-handoff-v1, or comic-publishing-package-v1.')
  }

  if (packageRecord.projectType === 'comic-book-video') {
    return createComicBookVideoProject(
      optionalString(packageRecord.title) || 'Imported Motion Comic Project',
      packageRecord as Partial<ComicBookVideoProjectPackage>,
    )
  }

  if (packageRecord.projectType === 'comic-book') {
    const importedComicPackage = packageRecord as ImportedComicBookPackage
    const sourceScenes = Array.isArray(importedComicPackage.scenes)
      ? (importedComicPackage.scenes ?? [])
      : []
    const sourceTitle = optionalString(packageRecord.title) || 'Imported Comic'
    const sourceSlug = optionalString(packageRecord.slug) || slugify(sourceTitle)
    const importedCreatedAt = optionalString(importedComicPackage.createdAt)
    const importedUpdatedAt = optionalString(importedComicPackage.updatedAt)

    return createComicBookVideoProject(`${sourceTitle} Motion Plan`, {
      slug: stableImportId(sourceSlug, 'motion-plan'),
      summary: optionalString(packageRecord.summary),
      ...(importedCreatedAt || importedUpdatedAt ? { createdAt: importedCreatedAt || importedUpdatedAt } : {}),
      ...(importedUpdatedAt || importedCreatedAt ? { updatedAt: importedUpdatedAt || importedCreatedAt } : {}),
      scenes: sourceScenes.map((scene, index) =>
        createSequence({
          id: stableImportId('import-page', scene.id ?? scene.pageNumber ?? index + 1),
          title: scene.title ?? `Sequence ${index + 1}`,
          sourcePage: scene.pageNumber ?? index + 1,
          sourcePanels: `1-${scene.panelCount ?? scene.panels?.length ?? 1}`,
          runtimeSeconds: Math.max(8, (scene.panelCount ?? scene.panels?.length ?? 1) * 3),
          transitionOut: scene.turnMoment ?? '',
          motionPlan: scene.summary ?? 'Translate the page beat into camera and panel movement.',
          beats: Array.isArray(scene.panels)
            ? scene.panels.map((panel, panelIndex) =>
                createBeat({
                  id: stableImportId('import-panel', scene.id ?? index + 1, panel.id ?? panel.panelNumber ?? panelIndex + 1),
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
