# WAYFINDER

A small, browser-only MVP for turning a long-term goal into a personal progress map.

## Run locally

From this directory, run:

```powershell
python -m http.server 4173
```

Then open <http://localhost:4173>.

The app has no build step, backend, or API key. Progress and journal entries are stored in this browser's local storage. The sample goal and example AI-style summary are illustrative; no AI service is connected.

## GitHub Pages

This is a static site and can be hosted on GitHub Pages. Publish the `wayfinder` folder as the root of a separate repository, then enable Pages from the repository's `main` branch. This directory is independent from the El Nino project.
