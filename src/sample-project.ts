import {
  createComicBookVideoProject,
  type ComicBookVideoProjectPackage,
} from './project-package'

export const sampleComicBookVideoProject: ComicBookVideoProjectPackage =
  createComicBookVideoProject('Neon Tomb Motion Cut', {
    summary:
      'A motion-comic adaptation of the flooded archive issue, balancing parallax stillness with selective bursts of movement.',
    status: 'ready-for-review',
    inputs: {
      targetFormat: '16:9 motion comic with 9:16 excerpt',
      narrationStrategy: 'Use sparse narration on setup pages, then let SFX and dialogue carry the reveal sections.',
      soundTargets: ['Rain bed', 'Archive hum', 'Glyph swell', 'Low-end hit on page turns'],
    },
    scenes: [
      {
        id: 'sequence-1',
        title: 'Archive descent',
        sourcePage: 1,
        sourcePanels: '1-5',
        runtimeSeconds: 18,
        motionPlan: 'Slow vertical pan, layered rain planes, emphasis on the title reveal.',
        narrationNotes: 'One opening caption over the skyline.',
        soundNotes: 'Distant thunder and low synth pulse.',
      },
      {
        id: 'sequence-2',
        title: 'The living map wakes',
        sourcePage: 2,
        sourcePanels: '1-6',
        runtimeSeconds: 24,
        motionPlan: 'Micro-zooms and mask reveals that make the glyph map feel alive inside the panel art.',
        narrationNotes: 'Give the glyph voice a distinct treated tone.',
        soundNotes: 'Swarming tones and brittle data crackle.',
      },
    ],
    outputs: [
      { id: 'output-1', label: 'Full motion comic', status: 'planned', target: '16:9 master' },
      { id: 'output-2', label: 'Hook cut', status: 'planned', target: '9:16 social excerpt' },
    ],
    metrics: {
      estimatedRenderPasses: 9,
    },
    notes: ['Keep page transitions clean and editorially legible.'],
  })
