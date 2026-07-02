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

> **Validating changes:** use `pnpm check` as the primary gate. `pnpm lint` currently fails on pre-existing non-code files (e.g. some `*.md` / prompt files) unrelated to your change — don't try to "fix" those; instead run Prettier on just the files you edited (`pnpm exec prettier --check <files>`).

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
  lib/                        # Shared code ($lib alias)
    TimelineChart.svelte      # Main chart: chatGroups, zoom/pan, glyphs, attention line
    TimelineMinimap.svelte    # Overview + brush (shows ALL chats)
    SelectedMessagesList.svelte # Viewport messages table + CSV export
    filter.svelte             # Multi-select filter UI
    types.ts                  # Message type
    data/
      index.ts                # allMessages (globs sessions/*.json)
      manifest.ts             # Session metadata
      sessions/*.json         # Per-session message data
  routes/
    +page.svelte              # Page: filter state, predicate, wires components
    +layout.svelte            # Root layout (imports Tailwind, favicon)
    layout.css                # Tailwind entry point
scripts/ingest.ts             # Data ingestion script
```

## Data Model

Messages are loaded from per-session JSON files under [`src/lib/data/sessions/`](src/lib/data/sessions/) and combined via [`src/lib/data/index.ts`](src/lib/data/index.ts) (`allMessages`). Each record (`Message` in [`src/lib/types.ts`](src/lib/types.ts)) has:

| Field          | Type                                     | Description                                           |
| -------------- | ---------------------------------------- | ----------------------------------------------------- |
| `t`            | naive local wall-clock string            | Message timestamp (no timezone — read HH:MM directly) |
| `t_video`      | number                                   | Seconds offset in source video                        |
| `direction`    | `'incoming' \| 'outgoing' \| 'not sent'` | Message direction                                     |
| `author`       | string                                   | Sender name                                           |
| `chatname`     | string                                   | Chat/conversation name (drives timeline rows)         |
| `content`      | string                                   | Message text                                          |
| `type`         | string                                   | Message type (e.g. `'text'`)                          |
| `platform`     | string                                   | Platform (e.g. `'WhatsApp'`, `'Instagram'`)           |
| `n_revisions`  | number                                   | Edit count                                            |
| `language`     | string \| undefined                      | Detected message language                             |
| `recording_id` | string                                   | Source recording id                                   |
| `message_id`   | string                                   | Unique id within a recording                          |

## How the Timeline Visualization Works

Entry point [`src/routes/+page.svelte`](src/routes/+page.svelte) → [`TimelineChart.svelte`](src/lib/TimelineChart.svelte) → [`TimelineMinimap.svelte`](src/lib/TimelineMinimap.svelte) + [`SelectedMessagesList.svelte`](src/lib/SelectedMessagesList.svelte).

- **Chats = rows.** Messages are grouped by `chatname` (`d3.group`) into `chatGroups`, sorted by each chat's first message time. Each group is one row (`rowHeight = 50`). This grouping is the core "how chats work" concept — reuse `chatGroups` rather than re-deriving it.
- **X axis** is a `d3.scaleTime` domain spanning 1h before the first message to 1h after the last, mapped across all sessions (not a fixed 24h day).
- **Zoom/pan**: `zoomLevel` + `panOffset` widen a virtual `zoomedWidth = innerWidth * zoomLevel` that gets clipped to the viewport. Mouse wheel zooms, middle-click / shift+drag pans. The minimap brush mirrors the same state (bindable `zoomLevel`/`panOffset`).
- **Visible chats only**: `visibleChatGroups` filters `chatGroups` to chats with ≥1 message inside the current `xScale.domain()` window. Rows, labels, `chatNames`, `mainChartHeight`, and the attention line all derive from `visibleChatGroups`, so inactive chats collapse as you zoom/pan. The **minimap keeps the full `chatGroups`** so the overview always shows every chat.
- **Message glyphs**: circle = incoming, triangle = outgoing, dashed square = not sent. Colored by `platform` via an ordinal `schemeCategory10` scale. The dashed **attention line** (`chronologicalMessages`) connects messages across chats in time order.
- `visibleStart`/`visibleEnd` are bound out of `TimelineChart` to `+page.svelte`, which feeds `SelectedMessagesList` (only messages inside the viewport, with CSV export).

## Filters

Filter UI lives in [`src/lib/filter.svelte`](src/lib/filter.svelte); state and predicate live in [`src/routes/+page.svelte`](src/routes/+page.svelte). All filters are multi-select checkbox groups, default all-selected, with a "Reset all" button and summary badges.

| Filter    | Field       | Options source                                        |
| --------- | ----------- | ----------------------------------------------------- |
| Direction | `direction` | fixed order incoming/outgoing/not sent (present only) |
| Type      | `type`      | unique sorted `type` values                           |
| Platform  | `platform`  | unique sorted `platform` values                       |
| Language  | `language`  | unique sorted `language` values                       |
| Chat      | `chatname`  | unique sorted `chatname` values                       |

To add a filter, mirror the existing pattern in both files: derive `xOptions`, add `selectedX = $state([...xOptions])`, add `selectedX.includes(message.x)` to the `filteredDataWithTime` predicate, add bindable props + a `<fieldset>` block + `toggleX` + include it in `resetAll`/`selectionSummary`, and pass it from `+page.svelte`. Filtering by chat drops that chat's row entirely (the `chatGroups` grouping only sees filtered data).

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
