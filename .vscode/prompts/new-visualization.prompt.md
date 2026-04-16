# New Visualization Component

Create a new Svelte visualization component following project conventions.

## Instructions

You are creating a data visualization component for the Texting in Time project. Follow these rules strictly:

1. **Svelte 5 runes only** — use `$state`, `$derived`, `$effect`, `$props`. Never use legacy `let`/`export let` bindings.
2. **D3 for math, Svelte for DOM** — use D3 scales, axes computations, data transforms. Render all SVG elements in Svelte `{#each}` blocks and templates. Never use `d3.select()` or `d3.append()`.
3. **TypeScript** — use `<script lang="ts">` and type all props and data.
4. **Tailwind CSS 4** — use utility classes for non-SVG styling.
5. Place reusable components in `src/lib/` and page-level visualizations in `src/routes/`.
6. Use the **svelte-autofixer** MCP tool to validate the component before finishing.

## Data Model

Each message record has: `t` (ISO timestamp), `t_video` (number), `direction` ('incoming' | 'outgoing'), `author` (string), `chatname` (string), `content` (string), `type` (string), `platform` (string), `n_revisions` (number).

## Pattern

```svelte
<script lang="ts">
  import * as d3 from 'd3';

  let { data, width = 800, height = 400 } = $props();

  const xScale = $derived(d3.scaleTime().domain(...).range([0, width]));
</script>

<svg {width} {height}>
	{#each data as d}
		<rect x={xScale(new Date(d.t))} ... />
	{/each}
</svg>
```

Describe the visualization you want to create: {{input}}
