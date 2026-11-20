# DanielPuertaBernal.github.io

Personal developer portfolio of Daniel Puerta Bernal: AI, software development and infrastructure.

Live: https://danielpuertabernal.github.io

## Stack

Plain HTML, CSS and vanilla JavaScript. No build step, no frameworks, no tracking.
Fonts come from Google Fonts (Space Grotesk, JetBrains Mono).

- `index.html` — single-page content (semantic sections, meta + Open Graph tags)
- `styles.css` — dark theme, layout, animations, `prefers-reduced-motion` support
- `main.js` — hero network canvas, terminal typing, scroll reveal, project filters, mobile menu
- `assets/` — favicon and Open Graph image
- `404.html` — not-found page

## Run locally

Any static server works:

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy

Every push to `main` runs `.github/workflows/deploy.yml`, which copies the static files into
`_site/` and publishes them with `actions/deploy-pages`. GitHub Pages must use the
"GitHub Actions" source (build type `workflow`).
