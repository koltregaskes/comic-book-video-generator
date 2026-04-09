# Comic Book Video Generator

Comic Book Video Generator converts comic packages into motion-comic video planning packages.

## Included in the current build

- import from `comic-book-generator`
- panel-to-shot sequencing
- nested motion beats inside each sequence
- motion and transition notes
- narration planning
- soundtrack and SFX notes
- deliverables and working-note management
- JSON export/import
- installable PWA support

## Run locally

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:4303`

The current baseline is designed to help you turn comic-page structure into:

- motion-comic sequences
- beat-level timing notes
- narration and soundtrack plans
- export-ready delivery packages

## Local-Only Files

- `.autolab/` is used for internal AutoResearch and should remain untracked
- `.env*` files are local-only
- `.local/` and `*.local.md` are for planning notes and are ignored
