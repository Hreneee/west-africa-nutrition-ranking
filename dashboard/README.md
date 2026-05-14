# West Africa Nutrition Prioritization Dashboard

One-page React + TypeScript + Vite dashboard prototype for presenting the nutrition-ranking pipeline as an accessible decision-support work sample.

## Run Locally

```bash
cd dashboard
npm install
npm run dev
```

## Build

```bash
cd dashboard
npm run build
npm run preview
```

## Deploy to GitHub Pages

This app uses `base: "./"` in `vite.config.ts`, so the built files can be served from a GitHub Pages project path.

Option 1, deploy with the included `gh-pages` script:

```bash
cd dashboard
npm install
npm run deploy
```

Option 2, use GitHub Pages or GitHub Actions to publish the `dashboard/dist` directory after running:

```bash
cd dashboard
npm run build
```

## Replacing Sample Data

The prototype data lives in:

```text
src/data/sampleDashboardData.ts
```

Replace `foodRecords`, `nutrientSignals`, and `dashboardSummary` with data parsed from the pipeline CSV outputs when you are ready to connect the real dataset.

## Visual Asset Attribution

The hero map uses `src/assets/west-africa-map.svg`, adapted from Wikimedia Commons:

- File: `Africa-countries-western.svg`
- Author: ReneeWrites
- License: Creative Commons Attribution 4.0 International
- Source: https://commons.wikimedia.org/wiki/File:Africa-countries-western.svg
