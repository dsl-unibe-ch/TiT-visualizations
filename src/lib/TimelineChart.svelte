<script lang="ts">
	import * as d3 from 'd3';
	import type { Message } from '$lib/types';
	import TimelineMinimap from '$lib/TimelineMinimap.svelte';

	let {
		data,
		visibleStart = $bindable<Date | null>(null),
		visibleEnd = $bindable<Date | null>(null)
	}: {
		data: Message[];
		visibleStart: Date | null;
		visibleEnd: Date | null;
	} = $props();

	// Layout constants
	const legendWidth = 228;
	const legendRowHeight = 18;
	const legendSectionTitleHeight = 16;
	const legendTopPadding = 28;
	const legendBottomPadding = 10;
	const legendSectionPadding = 10;
	const margin = {
		top: 70,
		right: 40,
		bottom: 20,
		left: 160
	};
	const rowHeight = 50;
	let width = $state(1400);
	let containerEl: HTMLDivElement;

	// Overview minimap constants
	const overviewHeight = 50;
	const overviewMarginTop = 16;

	// Group messages by chatname, sorted by first message time
	const chatGroups = $derived.by(() => {
		const groups = d3.group(data, (d: Message) => d.chatname);
		return [...groups.entries()]
			.map(([name, messages]) => {
				const sortedMessages = [...messages].sort(
					(a, b) => new Date(a.t).getTime() - new Date(b.t).getTime()
				);
				return [name, sortedMessages] as [string, Message[]];
			})
			.sort((a, b) => {
				const aFirst = new Date(a[1][0]?.t ?? 0).getTime();
				const bFirst = new Date(b[1][0]?.t ?? 0).getTime();
				return aFirst - bFirst;
			});
	});

	const chatNames = $derived(chatGroups.map(([name]) => name));

	// Dimensions
	const innerWidth = $derived(Math.max(1, width - margin.left - margin.right));
	const mainChartHeight = $derived(margin.top + chatNames.length * rowHeight + margin.bottom);

	// Extract the day from first message for scale domain
	// Time domain: 1 hour before first message to 1 hour after last message
	const domainStart = $derived.by(() => {
		const firstTime = d3.min(data, (d: Message) => new Date(d.t));
		if (!firstTime) return new Date();
		return d3.utcHour.offset(firstTime, -1);
	});

	const domainEnd = $derived.by(() => {
		const lastTime = d3.max(data, (d: Message) => new Date(d.t));
		if (!lastTime) return d3.utcHour.offset(domainStart, 2);
		return d3.utcHour.offset(lastTime, 1);
	});

	// Zoom state
	let zoomLevel = $state(1);
	let panOffset = $state(0);

	const minZoom = 1;
	const maxZoom = 48;

	// Zoomed x scale — wider virtual width that gets clipped
	const zoomedWidth = $derived(innerWidth * zoomLevel);
	const xScaleFull = $derived(
		d3.scaleTime().domain([domainStart, domainEnd]).range([0, zoomedWidth])
	);

	// The visible x scale maps the panned/zoomed portion back to the viewport
	const xScale = $derived.by(() => {
		const visibleStart = xScaleFull.invert(panOffset);
		const visibleEnd = xScaleFull.invert(panOffset + innerWidth);
		return d3.scaleTime().domain([visibleStart, visibleEnd]).range([0, innerWidth]);
	});

	$effect(() => {
		const [start, end] = xScale.domain();
		visibleStart = start;
		visibleEnd = end;
	});

	// Target number of ticks; the interval is the smallest "nice" step
	// that keeps the count at or below this target.
	const targetTickCount = 30;
	const niceStepsMinutes = [1, 2, 5, 10, 15, 30, 60, 120, 180, 360, 720, 1440];

	const ticks = $derived.by(() => {
		const [domainStart, domainEnd] = xScale.domain();
		const spanMinutes = (domainEnd.getTime() - domainStart.getTime()) / 60000;

		const idealStep = spanMinutes / targetTickCount;
		const step = niceStepsMinutes.find((s) => s >= idealStep) ?? niceStepsMinutes.at(-1)!;

		// Use appropriate interval type based on step size
		let interval: d3.TimeInterval;
		if (step < 60) {
			interval = d3.utcMinute.every(step)!;
		} else if (step < 1440) {
			interval = d3.utcHour.every(step / 60)!;
		} else {
			interval = d3.utcDay.every(step / 1440)!;
		}

		return interval.range(domainStart, domainEnd);
	});

	// Day boundaries for vertical separators
	const dayBoundaries = $derived.by(() => {
		const [domainStart, domainEnd] = xScale.domain();
		return d3.utcDay.range(d3.utcDay.ceil(domainStart), domainEnd);
	});

	const timeFormat = d3.timeFormat('%H:%M');
	const weekdayFormat = d3.timeFormat('%a');

	$effect(() => {
		if (!containerEl) return;

		const updateWidth = () => {
			width = Math.max(containerEl.clientWidth, margin.left + margin.right + 1);
		};

		updateWidth();

		const observer = new ResizeObserver(updateWidth);
		observer.observe(containerEl);

		return () => {
			observer.disconnect();
		};
	});

	// Handle wheel zoom
	let svgEl: SVGSVGElement;

	function handleWheel(e: WheelEvent) {
		e.preventDefault();

		const zoomFactor = 1.15;
		const direction = e.deltaY < 0 ? 1 : -1;
		const newZoom = Math.min(
			maxZoom,
			Math.max(minZoom, zoomLevel * (direction > 0 ? zoomFactor : 1 / zoomFactor))
		);

		const svgRect = svgEl.getBoundingClientRect();
		const mouseX = e.clientX - svgRect.left - margin.left;
		const mouseRatio = (panOffset + mouseX) / zoomedWidth;

		const newZoomedWidth = innerWidth * newZoom;
		const newPanOffset = mouseRatio * newZoomedWidth - mouseX;

		zoomLevel = newZoom;
		panOffset = Math.max(0, Math.min(newPanOffset, newZoomedWidth - innerWidth));
	}

	// Handle panning via middle-click drag or shift+drag
	let isPanning = $state(false);
	let panStartX = $state(0);
	let panStartOffset = $state(0);

	function handlePointerDown(e: PointerEvent) {
		if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
			e.preventDefault();
			isPanning = true;
			panStartX = e.clientX;
			panStartOffset = panOffset;
			(e.target as Element).setPointerCapture(e.pointerId);
		}
	}

	function handlePointerMove(e: PointerEvent) {
		if (!isPanning) return;
		const dx = e.clientX - panStartX;
		panOffset = Math.max(0, Math.min(panStartOffset - dx, zoomedWidth - innerWidth));
	}

	function handlePointerUp() {
		isPanning = false;
	}

	const platforms = $derived.by(() => {
		return Array.from(new Set(data.map((d) => d.platform).filter(Boolean))).sort(d3.ascending);
	});

	const platformColorScale = $derived.by(() => {
		const domain = platforms.length > 0 ? platforms : ['Unknown'];
		return d3.scaleOrdinal<string, string>(domain, d3.schemeCategory10);
	});

	function platformColor(platform: string): string {
		return platformColorScale(platform || 'Unknown');
	}

	const shapeLegendItems = [
		{ label: 'Incoming', direction: 'incoming', style: 'solid' },
		{ label: 'Outgoing', direction: 'outgoing', style: 'solid' },
		{ label: 'Not sent', direction: 'not sent', style: 'dashed' },
		{ label: 'Attention flow', direction: null, style: 'line' }
	] as const;

	const platformLegendItems = $derived(
		platforms.length > 0
			? platforms.map((platform) => ({
					label: platform,
					color: platformColor(platform)
				}))
			: [{ label: 'Unknown', color: platformColor('Unknown') }]
	);

	const legendHeight = $derived.by(() => {
		const shapeSectionHeight = shapeLegendItems.length * legendRowHeight;
		const platformSectionHeight =
			legendSectionTitleHeight + platformLegendItems.length * legendRowHeight;
		return (
			legendTopPadding +
			shapeSectionHeight +
			legendSectionPadding +
			platformSectionHeight +
			legendBottomPadding
		);
	});

	const totalHeight = $derived(
		mainChartHeight +
			overviewMarginTop +
			Math.max(overviewHeight, legendHeight) +
			legendSectionPadding
	);

	function directionShapePath(direction: Message['direction'], size = 130): string {
		const type =
			direction === 'incoming'
				? d3.symbolCircle
				: direction === 'outgoing'
					? d3.symbolTriangle
					: d3.symbolSquare;
		return d3.symbol().type(type).size(size)() ?? '';
	}

	// Attention line: all messages sorted chronologically with their row y-position
	const chatRowIndex = $derived(new Map(chatNames.map((name, i) => [name, i])));

	const chronologicalMessages = $derived.by(() => {
		const flattened = chatGroups.flatMap(([, messages]) => messages);
		const sorted = [...flattened].sort((a, b) => new Date(a.t).getTime() - new Date(b.t).getTime());
		const firstByTimestamp = d3.rollup(
			sorted,
			(values) => values[0],
			(msg) => msg.t
		);
		return Array.from(firstByTimestamp.values());
	});

	const attentionPath = $derived.by(() => {
		return chronologicalMessages.map((msg) => ({
			x: xScale(new Date(msg.t)),
			y: (chatRowIndex.get(msg.chatname) ?? 0) * rowHeight + rowHeight / 2
		}));
	});

	// Tooltip state
	let hoveredMsg: Message | null = $state(null);
	let tooltipX = $state(0);
	let tooltipY = $state(0);

	function formatVideoTime(seconds: number): string {
		const m = Math.floor(seconds / 60);
		const s = Math.floor(seconds % 60);
		return `${m}:${s.toString().padStart(2, '0')}`;
	}
</script>

<div class="relative w-full" bind:this={containerEl}>
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<svg
		{width}
		height={totalHeight}
		class="timeline-chart"
		bind:this={svgEl}
		onwheel={handleWheel}
		onpointerdown={handlePointerDown}
		onpointermove={handlePointerMove}
		onpointerup={handlePointerUp}
	>
		<!-- Legend -->
		<g transform="translate(8, {mainChartHeight + overviewMarginTop})">
			<rect
				x="0"
				y="0"
				width={legendWidth}
				height={legendHeight}
				rx="8"
				fill="var(--color-base-100)"
				stroke="var(--color-base-300)"
				stroke-width="1"
				opacity="0.96"
			/>
			<text x="12" y="20" font-size="12" font-weight="700" fill="var(--color-base-content)">
				Legend
			</text>
			{#each shapeLegendItems as item, index (`${item.label}-${index}`)}
				{@const y = 38 + index * legendRowHeight}
				{#if item.style === 'line'}
					<line
						x1="12"
						y1={y}
						x2="28"
						y2={y}
						stroke="var(--color-neutral)"
						stroke-width="2"
						stroke-dasharray="4 3"
					/>
				{:else}
					<path
						d={directionShapePath(item.direction, 80)}
						transform="translate(20, {y})"
						fill="var(--color-base-content)"
						fill-opacity={item.style === 'dashed' ? 0.2 : 0.9}
						stroke="var(--color-base-content)"
						stroke-width={item.style === 'dashed' ? 1.5 : 0}
						stroke-dasharray={item.style === 'dashed' ? '3 2' : 'none'}
					/>
				{/if}
				<text x="34" y={y + 4} font-size="11" fill="var(--color-base-content)">
					{item.label}
				</text>
			{/each}

			<text
				x="12"
				y={legendTopPadding + shapeLegendItems.length * legendRowHeight + legendSectionPadding + 12}
				font-size="11"
				font-weight="700"
				fill="var(--color-base-content)"
			>
				Platforms
			</text>
			{#each platformLegendItems as item, index (`platform-${item.label}-${index}`)}
				{@const y =
					legendTopPadding +
					shapeLegendItems.length * legendRowHeight +
					legendSectionPadding +
					26 +
					index * legendRowHeight}
				<circle cx="20" cy={y} r="5" fill={item.color} />
				<text x="34" y={y + 4} font-size="11" fill="var(--color-base-content)">
					{item.label}
				</text>
			{/each}
		</g>

		<!-- Fixed left labels -->
		<g transform="translate(0, {margin.top})">
			{#each chatGroups as [chatname, messages], i (chatname)}
				{@const y = i * rowHeight + rowHeight / 2}
				<!-- Chat name -->
				<text
					x={12}
					{y}
					dominant-baseline="middle"
					font-size="13"
					font-weight="600"
					fill="var(--color-base-content)"
				>
					{chatname}
				</text>
			{/each}
		</g>

		<!-- Clipped timeline area -->
		<defs>
			<clipPath id="chart-clip">
				<rect x={0} y={-margin.top} width={innerWidth} height={totalHeight} />
			</clipPath>
		</defs>

		<g transform="translate({margin.left}, {margin.top})" clip-path="url(#chart-clip)">
			<!-- Time axis ticks -->
			{#each ticks as tick (tick.getTime())}
				{@const tx = xScale(tick)}
				<g transform="translate({tx}, 0)">
					<line
						y1={-5}
						y2={chatNames.length * rowHeight}
						stroke="var(--color-base-300)"
						stroke-width="0.5"
					/>
					<text
						y={-10}
						text-anchor="end"
						transform="rotate(-45, 0, -10)"
						font-size="11"
						fill="var(--color-base-content)"
					>
						{timeFormat(tick)}
					</text>
				</g>
			{/each}

			<!-- Day separators and labels -->
			{#each dayBoundaries as day (day.getTime())}
				{@const dx = xScale(day)}
				<!-- Vertical separator line -->
				<line
					x1={dx}
					y1={-25}
					x2={dx}
					y2={chatNames.length * rowHeight}
					stroke="var(--color-base-300)"
					stroke-width="1.5"
					stroke-dasharray="none"
				/>
				<!-- Weekday label -->
				<text
					x={dx}
					y={-15}
					text-anchor="middle"
					dominant-baseline="middle"
					font-size="12"
					font-weight="600"
					fill="var(--color-base-content)"
				>
					{weekdayFormat(day)}
				</text>
			{/each}

			<!-- Attention line -->
			{#each attentionPath as point, i (`${point.x}-${point.y}`)}
				{#if i > 0}
					<line
						x1={attentionPath[i - 1].x}
						y1={attentionPath[i - 1].y}
						x2={point.x}
						y2={point.y}
						stroke="var(--color-neutral)"
						stroke-width="1"
						stroke-dasharray="4 3"
						fill="none"
					/>
				{/if}
			{/each}

			<!-- Chat rows -->
			{#each chatGroups as [chatname, messages], i (chatname)}
				{@const y = i * rowHeight + rowHeight / 2}

				<!-- Message blocks -->
				{#each messages as msg (msg.recording_id + msg.message_id)}
					{@const msgTime = new Date(msg.t)}
					<path
						d={directionShapePath(msg.direction)}
						transform="translate({xScale(msgTime)}, {y})"
						fill={platformColor(msg.platform)}
						fill-opacity={msg.direction === 'not sent' ? 0.2 : 0.9}
						stroke={platformColor(msg.platform)}
						stroke-width={msg.direction === 'not sent' ? 1.5 : 0}
						stroke-dasharray={msg.direction === 'not sent' ? '3 2' : 'none'}
						class="cursor-pointer"
						onpointerenter={() => {
							hoveredMsg = msg;
							tooltipX = xScale(msgTime);
							tooltipY = y - 22;
						}}
						onpointerleave={() => {
							hoveredMsg = null;
						}}
					/>
				{/each}
			{/each}
		</g>

		<!-- Overview minimap -->
		<g transform="translate({margin.left}, {mainChartHeight + overviewMarginTop})">
			<TimelineMinimap
				{chatGroups}
				dayStart={domainStart}
				dayEnd={domainEnd}
				{innerWidth}
				{platformColor}
				bind:zoomLevel
				bind:panOffset
				{minZoom}
				{maxZoom}
			/>
		</g>
	</svg>

	{#if hoveredMsg}
		<div
			class="pointer-events-none absolute z-10"
			style="left: {margin.left + tooltipX}px; top: {margin.top + tooltipY}px;"
		>
			<div class="tooltip-open tooltip tooltip-top">
				<div class="tooltip-content max-w-80 bg-neutral p-3 text-xs text-neutral-content shadow-lg">
					<p class="mb-2 text-sm font-semibold wrap-break-word">"{hoveredMsg.content}"</p>
					<dl class="grid grid-cols-[auto_1fr] justify-items-start gap-x-3 gap-y-0.5">
						<dt class="opacity-70">Author</dt>
						<dd>{hoveredMsg.author}</dd>
						<dt class="opacity-70">Time</dt>
						<dd>{timeFormat(new Date(hoveredMsg.t))}</dd>
						<dt class="opacity-70">Direction</dt>
						<dd class="capitalize">{hoveredMsg.direction}</dd>
						<dt class="opacity-70">Platform</dt>
						<dd>{hoveredMsg.platform}</dd>
						<dt class="opacity-70">Type</dt>
						<dd>{hoveredMsg.type}</dd>
						<dt class="opacity-70">Video</dt>
						<dd>{formatVideoTime(hoveredMsg.t_video)}</dd>
						{#if hoveredMsg.n_revisions > 0}
							<dt class="opacity-70">Revisions</dt>
							<dd>{hoveredMsg.n_revisions}</dd>
						{/if}
					</dl>
				</div>
				<div class="h-0 w-0"></div>
			</div>
		</div>
	{/if}
</div>

<style lang="postcss">
	.timeline-chart {
		font-family:
			system-ui,
			-apple-system,
			sans-serif;
	}
</style>
