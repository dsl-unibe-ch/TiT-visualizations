<script lang="ts">
	import type { Message } from './types.js';
	import HourHeatmap from './HourHeatmap.svelte';
	import ResponseTimes from './ResponseTimes.svelte';
	import BurstsView from './BurstsView.svelte';

	let { data }: { data: Message[] } = $props();

	const tabs = [
		{ id: 'hours', label: 'Time of day' },
		{ id: 'responses', label: 'Response time' },
		{ id: 'bursts', label: 'Bursts' }
	] as const;

	let active = $state<(typeof tabs)[number]['id']>('hours');
	// Shared between Bursts so both use the same burst definition.
	let burstGap = $state(10);
</script>

<section class="card mt-6 bg-base-200/40 card-border">
	<div class="card-body gap-4 p-4">
		<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
			<h2 class="card-title text-base">Analysis</h2>
			<div role="tablist" class="tabs tabs-border">
				{#each tabs as tab (tab.id)}
					<button
						role="tab"
						class="tab"
						class:tab-active={active === tab.id}
						aria-selected={active === tab.id}
						onclick={() => (active = tab.id)}>{tab.label}</button
					>
				{/each}
			</div>
		</div>

		{#if active === 'hours'}
			<HourHeatmap {data} />
		{:else if active === 'responses'}
			<ResponseTimes {data} />
		{:else}
			<BurstsView {data} bind:gap={burstGap} />
		{/if}
	</div>
</section>
