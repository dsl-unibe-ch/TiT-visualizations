# Texting in Time – Visualizations

Interactive data visualizations for the **Texting in Time (TiT)** research project. The app is built with SvelteKit 3, Svelte 5, TypeScript, D3.js, and Tailwind CSS 4.

## Getting started

Install dependencies with pnpm:

```sh
pnpm install
```

Start the development server:

```sh
pnpm dev
```

## Common commands

| Task                     | Command        |
| ------------------------ | -------------- |
| Type-check               | `pnpm check`   |
| Lint and format check    | `pnpm lint`    |
| Format files             | `pnpm format`  |
| Ingest source data       | `pnpm ingest`  |
| Build for production     | `pnpm build`   |
| Preview production build | `pnpm preview` |

Run `pnpm ingest` when source data needs to be regenerated before building. The GitHub Pages deployment workflow ingests data automatically.

## Deployment

The app uses SvelteKit's static adapter and is deployed to GitHub Pages by [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml). The workflow sets `BASE_PATH` to the repository name for project pages, then builds the static site into `build/`.

For local builds, `BASE_PATH` is optional. When set, it must be empty or start with `/`.

## Project structure

- `src/routes/` contains the SvelteKit routes.
- `src/lib/` contains shared visualization components and data.
- `src/lib/data/sessions/` contains per-session message data.
- `scripts/ingest.ts` ingests source data.

Shared library imports use the `#lib` package import alias.
