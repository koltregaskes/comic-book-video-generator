import {
  formatDuration,
  validateComicVideoImportPayload,
  type ComicBookVideoProjectPackage,
  type RenderHandoffManifest,
  type RenderOrchestrationPlan,
} from './project-package.ts'

export type FeedbackTone = 'neutral' | 'success' | 'warning' | 'error'

export type OperationFeedback = {
  tone: FeedbackTone
  message: string
  details?: string
}

export const IMPORT_CONTROL = {
  label: 'Import Package',
  accept: 'application/json',
} as const

export const RENDER_MANIFEST_CONTROLS = {
  copyLabel: 'Copy Manifest',
  exportLabel: 'Export Manifest',
} as const

export const RENDER_ORCHESTRATION_CONTROLS = {
  copyLabel: 'Copy Orchestration',
  exportLabel: 'Export Orchestration',
} as const

export function describeImportedArtifact(
  rawPackage: string,
  importedProject: ComicBookVideoProjectPackage,
  fileName: string,
): OperationFeedback {
  const parsed = JSON.parse(rawPackage) as unknown
  const formatVersion = isJsonRecord(parsed) && typeof parsed.formatVersion === 'string'
    ? parsed.formatVersion
    : 'JSON package'
  const projectType = isJsonRecord(parsed) && typeof parsed.projectType === 'string'
    ? parsed.projectType
    : 'handoff artifact'
  const sequenceCount = importedProject.scenes.length
  const beatCount = importedProject.scenes.reduce((sum, sequence) => sum + sequence.beats.length, 0)

  if (
    isJsonRecord(parsed)
    && (parsed.formatVersion === 'comic-queue-handoff-v1' || parsed.formatVersion === 'comic-publishing-package-v1')
  ) {
    const comicVideoImport = validateComicVideoImportPayload(parsed.comicVideoImport)

    return {
      tone: 'success',
      message: `Imported ${fileName}`,
      details: `Accepted ${parsed.formatVersion} with ${comicVideoImport.pageCount} page${comicVideoImport.pageCount === 1 ? '' : 's'} and ${comicVideoImport.panelCount} panel${comicVideoImport.panelCount === 1 ? '' : 's'}; generated ${sequenceCount} sequence${sequenceCount === 1 ? '' : 's'} and ${beatCount} beat block${beatCount === 1 ? '' : 's'}.`,
    }
  }

  return {
    tone: 'success',
    message: `Imported ${fileName}`,
    details: `Accepted ${formatVersion} ${projectType}; loaded ${sequenceCount} sequence${sequenceCount === 1 ? '' : 's'} and ${beatCount} beat block${beatCount === 1 ? '' : 's'}.`,
  }
}

export function describeManifestControls(manifest: RenderHandoffManifest) {
  return {
    heading: manifest.consistency.cutReady ? 'Cut-ready manifest' : 'Timing review needed',
    details: `Package helper check: ${manifest.consistency.issueCount} issue${manifest.consistency.issueCount === 1 ? '' : 's'}, ${formatDuration(manifest.consistency.totalGapSeconds)} unassigned, ${formatDuration(manifest.consistency.totalOverflowSeconds)} overflow.`,
    timelineLabel: `${manifest.timeline.length} timeline sequence${manifest.timeline.length === 1 ? '' : 's'}`,
    narrationLabel: `${manifest.narrationScript.length} narration cue${manifest.narrationScript.length === 1 ? '' : 's'}`,
    sfxLabel: `${manifest.sfxCueList.length} SFX cue${manifest.sfxCueList.length === 1 ? '' : 's'}`,
  }
}

export function describeOrchestrationControls(plan: RenderOrchestrationPlan) {
  const taskCount = plan.passes.reduce((sum, pass) => sum + pass.taskCount, 0)

  return {
    heading: plan.readiness.goNoGo === 'GO'
      ? 'Local renderer queue ready'
      : 'Renderer queue review needed',
    details: `Orchestration helper check: ${plan.readiness.percentComplete}% complete, ${plan.readiness.errorCount} error${plan.readiness.errorCount === 1 ? '' : 's'} and ${plan.readiness.warningCount} warning${plan.readiness.warningCount === 1 ? '' : 's'}. No media generation or connector call is started.`,
    passLabel: `${plan.passes.length} orchestration pass${plan.passes.length === 1 ? '' : 'es'}`,
    taskLabel: `${taskCount} local task${taskCount === 1 ? '' : 's'}`,
    generationLabel: plan.mediaGenerated ? 'Media generated' : 'No media generated',
  }
}

function isJsonRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
