# Texting in Time – Visualizations

Interactive data visualizations for the **Texting in Time (TiT)** research project, built with **SvelteKit**, **Svelte 5**, **D3.js**, and **Tailwind CSS 4**.

## Quick Reference

| Task       | Command        |
| ---------- | -------------- |
| Install    | `pnpm install` |
| Dev server | `pnpm dev`     |
| Build      | `pnpm build`   |
| Type-check | `pnpm check`   |
| Lint       | `pnpm lint`    |
| Format     | `pnpm format`  |

## Tech Stack & Conventions

- **Svelte 5** with runes mode enforced (`$state`, `$derived`, `$effect`, `$props` — no legacy `let`/`export let`)
- **TypeScript** (strict mode) — all components use `<script lang="ts">`
- **D3 v7** for data transformations and scales; **SVG rendering done in Svelte templates**, not via D3 DOM manipulation
- **Tailwind CSS 4** via Vite plugin — use utility classes; `layout.css` imports Tailwind
- **SvelteKit** with `adapter-auto` — file-based routing under `src/routes/`
- **pnpm** as package manager (do not use npm/yarn)
- **Prettier** with tabs, single quotes, no trailing commas, 100 char width. Svelte plugin + Tailwind plugin
- **ESLint** with TypeScript + Svelte plugins

## Project Structure

```
src/
  lib/              # Shared code ($lib alias)
    assets/data/    # Reference images and future CSV data files
  routes/           # SvelteKit pages
    +page.svelte    # Main visualization page
    +layout.svelte  # Root layout (imports Tailwind, favicon)
    layout.css      # Tailwind entry point
```

## Data Model

Messages are provided as arrays (CSV import planned). Each record has:

| Field         | Type                       | Description                                 |
| ------------- | -------------------------- | ------------------------------------------- |
| `t`           | ISO 8601 string            | Message timestamp                           |
| `t_video`     | number                     | Seconds offset in source video              |
| `direction`   | `'incoming' \| 'outgoing'` | Message direction                           |
| `author`      | string                     | Sender name                                 |
| `chatname`    | string                     | Chat/conversation name                      |
| `content`     | string                     | Message text                                |
| `type`        | string                     | Message type (e.g. `'text'`)                |
| `platform`    | string                     | Platform (e.g. `'WhatsApp'`, `'Instagram'`) |
| `n_revisions` | number                     | Edit count                                  |

## Visualization Design

Reference mockups are in [`src/lib/assets/data/`](src/lib/assets/data/). The target visualizations are **timeline charts** with:

- **Horizontal axis**: 24-hour time scale (00:00–23:30)
- **Rows**: One per contact/chat, labeled with name + platform icon
- **Message blocks**: Green (incoming) / Red (outgoing), positioned on the timeline
- **Gray bars**: Periods of active conversation
- **Dashed lines**: Cross-chat connections showing interaction flow
- **Group chats**: Multiple authors grouped with brackets

## D3 + Svelte Integration Pattern

Use D3 for **data and math** only. Render with Svelte:

```svelte
<script lang="ts">
  import * as d3 from 'd3';
  let { data } = $props();
  const xScale = $derived(d3.scaleTime().domain(...).range(...));
</script>

<svg>
	{#each data as d}
		<rect x={xScale(d.t)} ... />
	{/each}
</svg>
```

Do **not** use `d3.select()` or `d3.append()` to manipulate the DOM — let Svelte handle rendering.

## Svelte MCP Tools

Use the Svelte MCP server for documentation lookup and code validation:

1. **list-sections** — discover available doc sections (call first)
2. **get-documentation** — fetch relevant doc content
3. **svelte-autofixer** — validate Svelte code before committing (keep calling until clean)
4. **playground-link** — generate playground links (only after user confirms, never for project files)
