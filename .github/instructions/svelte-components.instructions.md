---
description: "Use when writing or editing Svelte components (.svelte) in this repo. Enforces Svelte 5 runes mode and the 'D3 for math, Svelte for rendering' rule."
applyTo: '**/*.svelte'
---

# Svelte Component Rules

## Svelte 5 runes (required)

- Use runes only — no legacy Svelte 4 syntax.
- State: `$state`, derived values: `$derived` / `$derived.by`, side effects: `$effect`, props: `$props`.
- Never use `export let`, top-level reactive `let`, `$:` reactive statements, or `createEventDispatcher`.
- Two-way/parent-bound props use `$bindable(...)`; pass callbacks as props instead of event dispatchers.
- Declare a `$derived` before it is referenced. The eager form `$derived(expr)` evaluates its argument immediately, so a rune that reads a later-declared rune must either be reordered above its consumers or use the lazy `$derived.by(() => ...)` form.
- Every component uses `<script lang="ts">` (TypeScript strict).

```svelte
<script lang="ts">
	let { data, selected = $bindable([]) }: { data: Item[]; selected: string[] } = $props();
	const count = $derived(data.length);
	$effect(() => {
		/* side effect */
	});
</script>
```

## D3 for math, Svelte for rendering (required)

- Use D3 only for **data and math**: scales (`d3.scaleTime`, `d3.scaleOrdinal`), grouping (`d3.group`, `d3.rollup`), stats (`d3.min`/`d3.max`), time intervals, and formatters.
- Render **all** SVG/DOM in the Svelte template with `{#each}` and bound attributes.
- Never use `d3.select()`, `d3.append()`, `.attr()`, `.data().enter()`, or any D3 DOM manipulation.
- Wrap D3-derived scales/layouts in `$derived` so they recompute reactively.

```svelte
<script lang="ts">
	import * as d3 from 'd3';
	let { data }: { data: Point[] } = $props();
	const xScale = $derived(d3.scaleTime().domain(extent).range([0, width]));
</script>

<svg>
	{#each data as d (d.id)}
		<circle cx={xScale(d.t)} cy={d.y} r="4" />
	{/each}
</svg>
```

## Styling

- Use Tailwind CSS 4 utility classes and daisyUI components; avoid custom CSS unless necessary.
- Prefer daisyUI semantic colors (`base-100`, `primary`, …) over fixed Tailwind colors so themes apply.

## SVG performance (Firefox-sensitive)

The timeline renders hundreds of SVG elements; Firefox is the bottleneck. Keep these rules to avoid regressions:

- Do **not** put `clip-path="url(#…)"` on large groups — Firefox renders it via a slow offscreen surface. Clip with a nested `<svg x=… width=… height=… overflow="hidden">` viewport instead.
- Batch many identical dashed strokes into a **single** `<polyline>`/`<path>` with `stroke-dasharray`, not one `<line>` per segment.
- Prefer native SVG primitives (`<circle>`, `<polygon>`, `<rect>`) over `d3.symbol()`-generated `<path>` strings for repeated glyphs.

See [AGENTS.md](../../AGENTS.md) for how the timeline visualization and filters work.
