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
      narrationStrategy:
        'Use sparse narration on setup pages, then let SFX and dialogue carry the reveal sections.',
      voiceTone: 'Low, intimate, slightly mythic',
      editRhythm: 'Long haunted openers, fast rupture on reveals, clean panel-to-panel breath.',
      soundTargets: ['Rain bed', 'Archive hum', 'Glyph swell', 'Low-end hit on page turns'],
      deliverySurfaces: ['16:9 master', '9:16 teaser', 'storyboard export'],
    },
    scenes: [
      {
        id: 'sequence-1',
        title: 'Archive descent',
        sourcePage: 1,
        sourcePanels: '1-4',
        runtimeSeconds: 18,
        transitionIn: 'Fade up from black into rain ambience',
        transitionOut: 'Hard cut into glyph reveal',
        motionPlan: 'Slow vertical pan, layered rain planes, emphasis on the title reveal.',
        narrationNotes: 'One opening caption over the skyline.',
        soundNotes: 'Distant thunder and low synth pulse.',
        beats: [
          {
            id: 'beat-1',
            label: 'Skyline open',
            sourcePanel: '1',
            durationSeconds: 6,
            movement: 'Slow push through rain haze',
            captionOverlay: 'The city keeps its dead in water.',
            narration: '',
            soundCue: 'Low thunder roll',
          },
          {
            id: 'beat-2',
            label: 'Scaffold descent',
            sourcePanel: '2',
            durationSeconds: 5,
            movement: 'Downward pan following Vera',
            captionOverlay: '',
            narration: '',
            soundCue: 'Metal creak and water drip',
          },
        ],
      },
      {
        id: 'sequence-2',
        title: 'The living map wakes',
        sourcePage: 2,
        sourcePanels: '1-5',
        runtimeSeconds: 24,
        transitionIn: 'Pulse of cyan glyph light',
        transitionOut: 'Echo hold for next page turn',
        motionPlan:
          'Micro-zooms and mask reveals that make the glyph map feel alive inside the panel art.',
        narrationNotes: 'Give the glyph voice a distinct treated tone.',
        soundNotes: 'Swarming tones and brittle data crackle.',
        beats: [
          {
            id: 'beat-3',
            label: 'Map reveal',
            sourcePanel: '1',
            durationSeconds: 8,
            movement: 'Wall-to-wall lateral pan with bloom pulse',
            captionOverlay: '',
            narration: '',
            soundCue: 'Synthetic swell',
          },
          {
            id: 'beat-4',
            label: 'Glyph touch',
            sourcePanel: '2',
            durationSeconds: 6,
            movement: 'Close-up zoom into hands',
            captionOverlay: '',
            narration: '...OPEN...',
            soundCue: 'Crystalline crackle',
          },
        ],
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
