<script lang="ts">
	import SelectedMessagesList from '$lib/SelectedMessagesList.svelte';
	import TimelineFilters from '$lib/filter.svelte';
	import TimelineChart from '$lib/TimelineChart.svelte';
	import type { Message } from '$lib/types';
	import { allMessages } from '$lib/data';
	import { messageId, searchContent, regexSearch } from '$lib/search';

	const data: Message[] = allMessages;

	const directionOrder: Message['direction'][] = ['incoming', 'outgoing', 'not sent'];
	const directionOptions: Message['direction'][] = directionOrder.filter((direction) =>
		data.some((message) => message.direction === direction)
	);
	const typeOptions = [...new Set(data.map((message) => message.type))].sort((a, b) =>
		a.localeCompare(b)
	);
	const platformOptions = [...new Set(data.map((message) => message.platform))].sort((a, b) =>
		a.localeCompare(b)
	);
	const languageOptions = [
		...new Set(data.filter((message) => message.language).map((message) => message.language!))
	].sort((a, b) => (a ?? '').localeCompare(b ?? ''));
	const chatOptions = [...new Set(data.map((message) => message.chatname))].sort((a, b) =>
		a.localeCompare(b)
	);

	let selectedDirections = $state<Message['direction'][]>([...directionOptions]);
	let selectedTypes = $state<string[]>([...typeOptions]);
	let selectedPlatforms = $state<string[]>([...platformOptions]);
	let selectedLanguages = $state<string[]>([...languageOptions]);
	let selectedChats = $state<string[]>([...chatOptions]);
	let visibleStart = $state<Date | null>(null);
	let visibleEnd = $state<Date | null>(null);
	let searchQuery = $state('');
	let searchMode = $state<'text' | 'regex'>('text');

	const dataWithTime = $derived.by(() => {
		return data.map((message) => ({
			message,
			ts: new Date(message.t).getTime()
		}));
	});

	const searchResult = $derived.by(() => {
		const q = searchQuery.trim();
		if (!q) return { ids: null, error: null };
		if (searchMode === 'regex') return regexSearch(q, 'i');
		return { ids: searchContent(q), error: null };
	});

	/** How many messages in the full dataset match the current search query. */
	const searchMatchCount = $derived(searchResult.ids?.size ?? 0);

	const filteredDataWithTime = $derived.by(() => {
		const matchIds = searchResult.ids;
		return dataWithTime.filter(
			({ message }) =>
				selectedDirections.includes(message.direction) &&
				selectedTypes.includes(message.type) &&
				selectedPlatforms.includes(message.platform) &&
				selectedLanguages.includes(message.language ?? '') &&
				selectedChats.includes(message.chatname) &&
				(matchIds === null || matchIds.has(messageId(message)))
		);
	});

	const filteredData = $derived(filteredDataWithTime.map(({ message }) => message));

	const visibleData = $derived.by((): Message[] => {
		if (!visibleStart || !visibleEnd) {
			return [...filteredDataWithTime].sort((a, b) => a.ts - b.ts).map(({ message }) => message);
		}

		const startMs = Math.min(visibleStart.getTime(), visibleEnd.getTime());
		const endMs = Math.max(visibleStart.getTime(), visibleEnd.getTime());

		return filteredDataWithTime
			.filter(({ ts }) => ts >= startMs && ts <= endMs)
			.sort((a, b) => a.ts - b.ts)
			.map(({ message }) => message);
	});

	const hasResults = $derived(filteredData.length > 0);
</script>

<div class="min-h-screen bg-base-100 p-8">
	<h1 class="mb-6 text-3xl font-bold text-base-content">Texting in Time — Data Visualization and Analysis Tool</h1>

	<div class="flex flex-col gap-6 lg:flex-row">
		<aside class="lg:sticky lg:top-4 lg:h-fit lg:w-64 lg:shrink-0">
			<TimelineFilters
				{directionOptions}
				{languageOptions}
				{typeOptions}
				{platformOptions}
				{chatOptions}
				bind:selectedDirections
				bind:selectedTypes
				bind:selectedPlatforms
				bind:selectedLanguages
				bind:selectedChats
				bind:searchQuery
				bind:searchMode
				searchError={searchResult.error}
				{searchMatchCount}
			/>
		</aside>

		<div class="min-w-0 flex-1">
			<p class="mb-4 text-sm text-base-content/70">
				Showing {visibleData.length} visible messages ({filteredData.length} after filters, {data.length}
				total)
			</p>

			{#if hasResults}
				<div class="overflow-x-auto">
					<TimelineChart data={filteredData} bind:visibleStart bind:visibleEnd />
				</div>

				{#if visibleData.length === 0}
					<div role="status" class="mt-4 alert alert-soft alert-info">
						<span>No filtered messages are visible in the current timeline viewport.</span>
					</div>
				{:else}
					<SelectedMessagesList messages={visibleData} />
				{/if}
			{:else}
				<div role="alert" class="alert alert-soft alert-warning">
					<span>No messages match your filters. Adjust selections or reset all.</span>
				</div>
			{/if}
		</div>
	</div>
</div>
