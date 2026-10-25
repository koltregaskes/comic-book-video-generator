import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  IMPORT_CONTROL,
  RENDER_MANIFEST_CONTROLS,
  RENDER_ORCHESTRATION_CONTROLS,
  describeImportedArtifact,
  describeManifestControls,
  describeOrchestrationControls,
} from '../src/app-control-contract.ts'
import {
  analyseTimelineConsistency,
  createComicBookVideoProject,
  createRenderOrchestrationPlan,
  createRenderHandoffManifest,
  parseProjectPackage,
  reorderProjectSequences,
  reorderSequenceBeats,
  validateComicVideoImportPayload,
} from '../src/project-package.ts'

const sourceProject = {
  formatVersion: 'creative-project-package-v1',
  projectType: 'comic-book',
  title: 'Neon Tomb Issue One',
  slug: 'neon-tomb-issue-one',
  status: 'ready-for-review',
  updatedAt: '2026-04-26T23:30:00.000Z',
  issueNumber: 1,
  seriesTitle: 'Neon Tomb',
}

const comicVideoImport = {
  pageCount: 1,
  panelCount: 2,
  pages: [
    {
      id: 'page-1',
      pageNumber: 1,
      title: 'Cold Open',
      turnMoment: 'Reveal the flooded archive door as the first real threat.',
      panelCount: 2,
      panels: [
        {
          id: 'page-1-panel-1',
          panelNumber: 1,
          action: 'Show the drowned skyline and the archive ruin beyond.',
          prompt: 'Wide comic panel, drowned neon skyline, monumental archive ruin.',
          dialogue: '',
          caption: 'The city keeps its dead in water.',
        },
        {
          id: 'page-1-panel-2',
          panelNumber: 2,
          action: 'Vera lowers herself down the broken maintenance scaffold.',
          prompt: 'Vertical panel, thief descending a wet metal scaffold, cyan light below.',
          dialogue: 'Keep the lamp low.',
          caption: '',
        },
      ],
    },
  ],
}

const queueHandoffPackage = {
  formatVersion: 'comic-queue-handoff-v1',
  generatedAt: '2026-04-27T01:55:00.000Z',
  sourceProject,
  summary: {
    totalAssets: 1,
    linkedAssets: 1,
    queuedAssets: 1,
    runningAssets: 0,
    approvedAssets: 0,
    blockedAssets: 0,
  },
  items: [],
  publishingHandoff: {
    outputs: [
      {
        id: 'output-1',
        label: 'Issue package',
        status: 'planned',
        target: 'Comic package JSON export',
        format: 'json',
        notes: 'Primary structured export for the wider toolchain.',
      },
    ],
    reviewFocus: ['Check cover readability before final package.'],
    notes: ['Keep the cover glyph language consistent in publishing review.'],
  },
  comicVideoImport,
}

const publishingPackage = {
  formatVersion: 'comic-publishing-package-v1',
  generatedAt: '2026-04-27T02:05:00.000Z',
  sourceProject,
  sourceQueueHandoff: {
    formatVersion: 'comic-queue-handoff-v1',
    generatedAt: queueHandoffPackage.generatedAt,
    summary: queueHandoffPackage.summary,
  },
  readiness: {
    goNoGo: 'NO-GO',
    percentComplete: 80,
    checklistPassed: 4,
    checklistTotal: 5,
    approvedAssets: 0,
    totalAssets: 1,
    blockedAssets: 0,
  },
  reviewChecklist: [],
  approvalPromotions: [],
  exportManifest: {
    packageSlug: 'neon-tomb-issue-one',
    artifacts: [],
  },
  publishingHandoff: queueHandoffPackage.publishingHandoff,
  comicVideoImport,
}

const timelineProject = createComicBookVideoProject('Timeline Handoff Demo', {
  slug: 'timeline-handoff-demo',
  summary: 'A deterministic two-sequence motion timeline.',
  status: 'ready-for-handoff',
  createdAt: '2026-04-26T20:00:00.000Z',
  updatedAt: '2026-04-27T03:00:00.000Z',
  inputs: {
    targetFormat: '16:9 motion comic',
    narrationStrategy: 'Use beat-level narration.',
    voiceTone: 'Grounded',
    editRhythm: 'Tight two-sequence handoff.',
    soundTargets: ['Door hit', 'Archive hum'],
    deliverySurfaces: ['Cut-ready manifest'],
  },
  scenes: [
    {
      id: 'sequence-a',
      title: 'Door approach',
      sourcePage: 1,
      sourcePanels: '1-2',
      runtimeSeconds: 8,
      transitionIn: 'Fade in',
      transitionOut: 'Cut on door impact',
      motionPlan: 'Push toward the archive door.',
      narrationNotes: 'Caption then dialogue.',
      soundNotes: 'Rain bed and door hit.',
      beats: [
        {
          id: 'beat-a1',
          label: 'Rain caption',
          sourcePanel: '1',
          durationSeconds: 4,
          movement: 'Slow push through rain.',
          captionOverlay: 'The archive waits below.',
          narration: '',
          soundCue: 'Rain bed',
        },
        {
          id: 'beat-a2',
          label: 'Door line',
          sourcePanel: '2',
          durationSeconds: 4,
          movement: 'Snap zoom to the door seal.',
          captionOverlay: '',
          narration: 'Open it before the tide turns.',
          soundCue: 'Metal seal hit',
        },
      ],
    },
    {
      id: 'sequence-b',
      title: 'Map ignition',
      sourcePage: 2,
      sourcePanels: '1-2',
      runtimeSeconds: 10,
      transitionIn: 'Blue flare',
      transitionOut: 'Hold on map pulse',
      motionPlan: 'Reveal the living map.',
      narrationNotes: 'Let SFX carry the reveal.',
      soundNotes: 'Archive hum, then glyph shimmer.',
      beats: [
        {
          id: 'beat-b1',
          label: 'Map wakes',
          sourcePanel: '1',
          durationSeconds: 6,
          movement: 'Lateral pan across glowing map lines.',
          captionOverlay: '',
          narration: '',
          soundCue: 'Archive hum rising',
        },
        {
          id: 'beat-b2',
          label: 'Glyph pulse',
          sourcePanel: '2',
          durationSeconds: 4,
          movement: 'Micro zoom on glyph pulse.',
          captionOverlay: '',
          narration: 'It knows the way.',
          soundCue: 'Glyph shimmer',
        },
      ],
    },
  ],
  outputs: [
    {
      id: 'output-cut-ready',
      label: 'Cut-ready manifest',
      status: 'ready',
      target: 'Editor JSON handoff',
    },
  ],
  notes: ['No unassigned timeline gaps.'],
})

describe('comic book video import validation', () => {
  it('validates the comicVideoImport payload carried by upstream handoff artifacts', () => {
    const validated = validateComicVideoImportPayload(comicVideoImport)

    assert.equal(validated.pageCount, 1)
    assert.equal(validated.panelCount, 2)
    assert.equal(validated.pages[0]?.panels[1]?.prompt.includes('cyan light'), true)
  })

  it('imports comic-queue-handoff-v1 as a deterministic motion-comic plan', () => {
    const firstImport = parseProjectPackage(JSON.stringify(queueHandoffPackage))
    const secondImport = parseProjectPackage(JSON.stringify(queueHandoffPackage))
    const firstSequence = firstImport.scenes[0]
    const firstBeat = firstSequence?.beats[0]

    assert.deepEqual(firstImport, secondImport)
    assert.equal(firstImport.projectType, 'comic-book-video')
    assert.equal(firstImport.title, 'Neon Tomb Issue One Motion Plan')
    assert.equal(firstImport.slug, 'neon-tomb-issue-one-motion-plan')
    assert.equal(firstImport.createdAt, sourceProject.updatedAt)
    assert.equal(firstImport.updatedAt, queueHandoffPackage.generatedAt)
    assert.equal(firstImport.outputs[0]?.id, 'output-1')
    assert.equal(firstImport.notes.includes('Imported from comic-queue-handoff-v1.'), true)
    assert.equal(firstSequence?.id, 'import-page-page-1')
    assert.equal(firstSequence?.sourcePanels, '1-2')
    assert.equal(firstSequence?.runtimeSeconds, 8)
    assert.equal(firstSequence?.transitionOut, comicVideoImport.pages[0]?.turnMoment)
    assert.equal(firstBeat?.id, 'import-panel-page-1-page-1-panel-1')
    assert.equal(firstBeat?.captionOverlay, 'The city keeps its dead in water.')
  })

  it('imports comic-publishing-package-v1 with the same downstream video payload contract', () => {
    const imported = parseProjectPackage(JSON.stringify(publishingPackage))

    assert.equal(imported.projectType, 'comic-book-video')
    assert.equal(imported.updatedAt, publishingPackage.generatedAt)
    assert.equal(imported.scenes.length, 1)
    assert.equal(imported.scenes[0]?.beats.length, 2)
    assert.equal(imported.notes.includes('Imported from comic-publishing-package-v1.'), true)
  })

  it('rejects handoff artifacts when declared video counts do not match the actual payload', () => {
    const stalePanelCountPackage = {
      ...queueHandoffPackage,
      comicVideoImport: {
        ...comicVideoImport,
        panelCount: 99,
      },
    }

    assert.throws(
      () => parseProjectPackage(JSON.stringify(stalePanelCountPackage)),
      /comicVideoImport\.panelCount/,
    )
  })

  it('rejects downstream artifacts that are not sourced from a comic-book project', () => {
    const wrongSourceProjectPackage = {
      ...queueHandoffPackage,
      sourceProject: {
        ...sourceProject,
        projectType: 'music-video',
      },
    }

    assert.throws(
      () => parseProjectPackage(JSON.stringify(wrongSourceProjectPackage)),
      /sourceProject must describe a comic-book creative-project-package-v1 source project/,
    )
  })

  it('keeps legacy comic-book project imports deterministic when source IDs are present', () => {
    const comicBookPackage = {
      formatVersion: 'creative-project-package-v1',
      projectType: 'comic-book',
      title: 'Panel Count Regression',
      slug: 'panel-count-regression',
      summary: 'A direct creative package import.',
      createdAt: '2026-04-26T20:00:00.000Z',
      updatedAt: '2026-04-26T21:00:00.000Z',
      scenes: [
        {
          id: 'source-page-a',
          pageNumber: 3,
          title: 'Doorway',
          panelCount: 1,
          summary: 'Translate this page into one motion beat.',
          turnMoment: 'Hold on the door opening.',
          panels: [
            {
              id: 'source-panel-a',
              panelNumber: 5,
              action: 'The archive door opens under the waterline.',
              caption: '',
              dialogue: 'It heard us.',
              prompt: 'Comic panel, submerged archive door opening.',
            },
          ],
        },
      ],
    }

    const firstImport = parseProjectPackage(JSON.stringify(comicBookPackage))
    const secondImport = parseProjectPackage(JSON.stringify(comicBookPackage))

    assert.deepEqual(firstImport, secondImport)
    assert.equal(firstImport.slug, 'panel-count-regression-motion-plan')
    assert.equal(firstImport.createdAt, comicBookPackage.createdAt)
    assert.equal(firstImport.updatedAt, comicBookPackage.updatedAt)
    assert.equal(firstImport.scenes[0]?.id, 'import-page-source-page-a')
    assert.equal(firstImport.scenes[0]?.beats[0]?.id, 'import-panel-source-page-a-source-panel-a')
    assert.deepEqual(firstImport.outputs, [])

    const comicWithDeliverables = {
      ...comicBookPackage,
      scenes: [
        comicBookPackage.scenes[0],
        {
          id: 'source-page-b',
          pageNumber: 4,
          title: 'After the door',
          panelCount: 1,
          summary: 'Hold on the reaction.',
          turnMoment: 'Cut to Vera.',
          panels: [
            {
              id: 'source-panel-b',
              panelNumber: 1,
              action: 'Vera recoils from the opening door.',
              caption: 'Too late.',
              dialogue: '',
              prompt: 'Close comic panel, thief recoiling in cyan light.',
            },
          ],
        },
      ],
      outputs: [
        {
          id: 'output-1',
          label: 'Issue package',
          status: 'planned',
          target: 'Comic package JSON export',
          format: 'json',
          notes: 'Primary structured export.',
        },
      ],
      notes: ['Keep the glyph language.'],
    }
    const importedWithDeliverables = parseProjectPackage(JSON.stringify(comicWithDeliverables))
    const deliverablePlan = createRenderOrchestrationPlan(importedWithDeliverables)

    assert.equal(importedWithDeliverables.outputs[0]?.id, 'output-1')
    assert.equal(importedWithDeliverables.outputs[0]?.label, 'Issue package')
    assert.equal(importedWithDeliverables.outputs[0]?.target, 'Comic package JSON export')
    assert.equal(importedWithDeliverables.notes.includes('Imported from a comic-book package.'), true)
    assert.equal(importedWithDeliverables.notes.includes('Keep the glyph language.'), true)
    assert.equal(
      importedWithDeliverables.scenes[0]?.beats[0]?.soundCue,
      'Reference source visual prompt for ambience.',
    )
    assert.match(importedWithDeliverables.scenes[0]?.soundNotes ?? '', /visual-prompt/)
    assert.equal(deliverablePlan.issues.some((issue) => issue.code === 'missing-delivery-output'), false)
  })

  it('reorders sequences and beat blocks only when the requested order is complete', () => {
    const reorderedProject = reorderProjectSequences(timelineProject, ['sequence-b', 'sequence-a'])
    const reorderedBeats = reorderSequenceBeats(timelineProject, 'sequence-a', ['beat-a2', 'beat-a1'])

    assert.deepEqual(
      reorderedProject.scenes.map((sequence) => sequence.id),
      ['sequence-b', 'sequence-a'],
    )
    assert.deepEqual(
      reorderedBeats.scenes[0]?.beats.map((beat) => beat.id),
      ['beat-a2', 'beat-a1'],
    )
    assert.equal(reorderedProject.updatedAt, timelineProject.updatedAt)

    assert.throws(
      () => reorderProjectSequences(timelineProject, ['sequence-b']),
      /sequence order must include each existing sequence exactly once/,
    )
    assert.throws(
      () => reorderSequenceBeats(timelineProject, 'sequence-a', ['beat-a1', 'beat-a1']),
      /beat order contains duplicate ID/,
    )
  })

  it('reports duration gaps, overflows, and non-positive timeline durations', () => {
    const problematicProject = createComicBookVideoProject('Problem Timeline', {
      createdAt: '2026-04-26T20:00:00.000Z',
      updatedAt: '2026-04-27T03:10:00.000Z',
      scenes: [
        {
          id: 'sequence-gap',
          title: 'Gap sequence',
          sourcePage: 1,
          sourcePanels: '1',
          runtimeSeconds: 10,
          transitionIn: '',
          transitionOut: '',
          motionPlan: '',
          narrationNotes: '',
          soundNotes: '',
          beats: [
            {
              id: 'beat-gap',
              label: 'Short beat',
              sourcePanel: '1',
              durationSeconds: 4,
              movement: '',
              captionOverlay: '',
              narration: '',
              soundCue: '',
            },
          ],
        },
        {
          id: 'sequence-overflow',
          title: 'Overflow sequence',
          sourcePage: 2,
          sourcePanels: '1',
          runtimeSeconds: 5,
          transitionIn: '',
          transitionOut: '',
          motionPlan: '',
          narrationNotes: '',
          soundNotes: '',
          beats: [
            {
              id: 'beat-overflow',
              label: 'Long beat',
              sourcePanel: '1',
              durationSeconds: 7,
              movement: '',
              captionOverlay: '',
              narration: '',
              soundCue: '',
            },
          ],
        },
        {
          id: 'sequence-bad-duration',
          title: 'Bad duration sequence',
          sourcePage: 3,
          sourcePanels: '1',
          runtimeSeconds: 0,
          transitionIn: '',
          transitionOut: '',
          motionPlan: '',
          narrationNotes: '',
          soundNotes: '',
          beats: [
            {
              id: 'beat-bad-duration',
              label: 'Bad beat',
              sourcePanel: '1',
              durationSeconds: -1,
              movement: '',
              captionOverlay: '',
              narration: '',
              soundCue: '',
            },
          ],
        },
      ],
    })
    const report = analyseTimelineConsistency(problematicProject)
    const issueCodes = report.issues.map((issue) => issue.code)

    assert.equal(report.cutReady, false)
    assert.equal(report.totalGapSeconds, 6)
    assert.equal(report.totalOverflowSeconds, 2)
    assert.equal(issueCodes.includes('beat-duration-gap'), true)
    assert.equal(issueCodes.includes('beat-duration-overflow'), true)
    assert.equal(issueCodes.includes('non-positive-sequence-duration'), true)
    assert.equal(issueCodes.includes('non-positive-beat-duration'), true)
  })

  it('creates a deterministic render handoff manifest with timeline, narration, and SFX cues', () => {
    const manifest = createRenderHandoffManifest(timelineProject)

    assert.equal(manifest.formatVersion, 'comic-video-render-handoff-v1')
    assert.equal(manifest.generatedAt, timelineProject.updatedAt)
    assert.equal(manifest.project.cutReady, true)
    assert.equal(manifest.project.totalRuntimeSeconds, 18)
    assert.equal(manifest.timeline[1]?.startSeconds, 8)
    assert.equal(manifest.timeline[1]?.beats[0]?.startSeconds, 8)
    assert.equal(manifest.timeline[1]?.beats[1]?.endSeconds, 18)
    assert.deepEqual(
      manifest.narrationScript.map((cue) => cue.id),
      ['narration-beat-a1', 'narration-beat-a2', 'narration-beat-b2'],
    )
    assert.deepEqual(
      manifest.sfxCueList.map((cue) => cue.id),
      ['sfx-beat-a1', 'sfx-beat-a2', 'sfx-beat-b1', 'sfx-beat-b2'],
    )
    assert.equal(manifest.outputs[0]?.id, 'output-cut-ready')
  })

  it('turns validated upstream handoff imports into cut-ready render manifests', () => {
    const importedProject = parseProjectPackage(JSON.stringify(queueHandoffPackage))
    const manifest = createRenderHandoffManifest(importedProject)

    assert.equal(manifest.project.cutReady, true)
    assert.equal(manifest.project.totalRuntimeSeconds, 8)
    assert.equal(manifest.timeline[0]?.beats[1]?.startSeconds, 4)
    assert.equal(manifest.narrationScript.length, 2)
    assert.equal(manifest.sfxCueList.length, 2)
    assert.equal(manifest.consistency.issueCount, 0)
  })

  it('creates a local-only render orchestration plan from a cut-ready manifest', () => {
    const plan = createRenderOrchestrationPlan(timelineProject)

    assert.equal(plan.formatVersion, 'comic-video-render-orchestration-v1')
    assert.equal(plan.generatedAt, timelineProject.updatedAt)
    assert.equal(plan.mediaGenerated, false)
    assert.equal(plan.externalConnectorRequired, false)
    assert.equal(plan.sourceManifest.formatVersion, 'comic-video-render-handoff-v1')
    assert.equal(plan.sourceManifest.cutReady, true)
    assert.equal(plan.readiness.goNoGo, 'GO')
    assert.equal(plan.readiness.errorCount, 0)
    assert.equal(plan.passes.length, 4)
    assert.deepEqual(
      plan.passes.map((pass) => pass.stage),
      ['preflight', 'shot-assembly', 'audio', 'delivery'],
    )
    assert.equal(plan.passes[1]?.taskCount, 4)
    assert.equal(plan.passes[1]?.tasks[0]?.startSeconds, 0)
    assert.equal(plan.passes[1]?.tasks[3]?.endSeconds, 18)
    assert.equal(plan.passes[3]?.tasks[0]?.outputs[0], 'Editor JSON handoff')
    assert.equal(plan.notes[1]?.includes('No video, image, audio'), true)
  })

  it('marks render orchestration NO-GO when renderer handoff essentials are missing', () => {
    const incompleteProject = createComicBookVideoProject('Incomplete Render Queue', {
      createdAt: '2026-04-26T20:00:00.000Z',
      updatedAt: '2026-04-27T03:30:00.000Z',
      scenes: [
        {
          id: 'sequence-empty-motion',
          title: 'Needs motion',
          sourcePage: 1,
          sourcePanels: '1',
          runtimeSeconds: 4,
          transitionIn: '',
          transitionOut: '',
          motionPlan: '',
          narrationNotes: '',
          soundNotes: '',
          beats: [
            {
              id: 'beat-empty-motion',
              label: 'Missing movement',
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
    })
    const plan = createRenderOrchestrationPlan(incompleteProject)
    const issueCodes = plan.issues.map((issue) => issue.code)

    assert.equal(plan.readiness.goNoGo, 'NO-GO')
    assert.equal(plan.readiness.errorCount, 2)
    assert.equal(issueCodes.includes('missing-motion-direction'), true)
    assert.equal(issueCodes.includes('missing-delivery-output'), true)
    assert.equal(issueCodes.includes('missing-narration-or-caption'), true)
    assert.equal(issueCodes.includes('missing-sound-cue'), true)
    assert.equal(plan.passes[1]?.status, 'needs-review')
    assert.equal(plan.passes[3]?.tasks[0]?.id, 'delivery-missing-output')
  })

  it('keeps import, manifest, and orchestration UI control contracts stable', () => {
    const importedProject = parseProjectPackage(JSON.stringify(queueHandoffPackage))
    const importFeedback = describeImportedArtifact(
      JSON.stringify(queueHandoffPackage),
      importedProject,
      'queue-handoff.json',
    )
    const manifestSummary = describeManifestControls(createRenderHandoffManifest(timelineProject))
    const orchestrationSummary = describeOrchestrationControls(createRenderOrchestrationPlan(timelineProject))

    assert.equal(IMPORT_CONTROL.label, 'Import Package')
    assert.equal(IMPORT_CONTROL.accept, 'application/json')
    assert.equal(RENDER_MANIFEST_CONTROLS.copyLabel, 'Copy Manifest')
    assert.equal(RENDER_MANIFEST_CONTROLS.exportLabel, 'Export Manifest')
    assert.equal(RENDER_ORCHESTRATION_CONTROLS.copyLabel, 'Copy Orchestration')
    assert.equal(RENDER_ORCHESTRATION_CONTROLS.exportLabel, 'Export Orchestration')

    assert.equal(importFeedback.tone, 'success')
    assert.equal(importFeedback.message, 'Imported queue-handoff.json')
    assert.equal(
      importFeedback.details,
      'Accepted comic-queue-handoff-v1 with 1 page and 2 panels; generated 1 sequence and 2 beat blocks.',
    )

    assert.equal(manifestSummary.heading, 'Cut-ready manifest')
    assert.equal(manifestSummary.details, 'Package helper check: 0 issues, 0:00 unassigned, 0:00 overflow.')
    assert.equal(manifestSummary.timelineLabel, '2 timeline sequences')
    assert.equal(manifestSummary.narrationLabel, '3 narration cues')
    assert.equal(manifestSummary.sfxLabel, '4 SFX cues')

    assert.equal(orchestrationSummary.heading, 'Local renderer queue ready')
    assert.equal(
      orchestrationSummary.details,
      'Orchestration helper check: 95% complete, 0 errors and 1 warning. No media generation or connector call is started.',
    )
    assert.equal(orchestrationSummary.passLabel, '4 orchestration passes')
    assert.equal(orchestrationSummary.taskLabel, '8 local tasks')
    assert.equal(orchestrationSummary.generationLabel, 'No media generated')
  })
})
