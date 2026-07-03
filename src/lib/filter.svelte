<script lang="ts">
	import type { Message } from '$lib/types';

	let {
		directionOptions,
		typeOptions,
		platformOptions,
		languageOptions,
		chatOptions,
		selectedDirections = $bindable(),
		selectedTypes = $bindable(),
		selectedPlatforms = $bindable(),
		selectedLanguages = $bindable(),
		selectedChats = $bindable(),
		searchQuery = $bindable(),
		searchMode = $bindable(),
		searchError,
		searchMatchCount
	}: {
		directionOptions: Message['direction'][];
		typeOptions: string[];
		platformOptions: string[];
		languageOptions: string[];
		chatOptions: string[];
		selectedDirections: Message['direction'][];
		selectedTypes: string[];
		selectedPlatforms: string[];
		selectedLanguages: string[];
		selectedChats: string[];
		searchQuery: string;
		searchMode: 'text' | 'regex';
		searchError: string | null;
		searchMatchCount: number;
	} = $props();

	function toggleValue<T extends string>(option: T, current: T[], checked: boolean): T[] {
		if (checked) {
			return current.includes(option) ? current : [...current, option];
		}
		return current.filter((value) => value !== option);
	}

	function resetAll() {
		selectedDirections = [...directionOptions];
		selectedTypes = [...typeOptions];
		selectedPlatforms = [...platformOptions];
		selectedLanguages = [...languageOptions];
		selectedChats = [...chatOptions];
		searchQuery = '';
	}

	function toTitle(value: string): string {
		return value
			.split(' ')
			.map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
			.join(' ');
	}

	type FilterDescriptor = {
		label: string;
		options: string[];
		selected: string[];
		toggle: (option: string, checked: boolean) => void;
		setAll: (checked: boolean) => void;
		format: (value: string) => string;
	};

	const filters = $derived<FilterDescriptor[]>([
		{
			label: 'Direction',
			options: directionOptions,
			selected: selectedDirections,
			toggle: (option, checked) =>
				(selectedDirections = toggleValue(
					option as Message['direction'],
					selectedDirections,
					checked
				)),
			setAll: (checked) => (selectedDirections = checked ? [...directionOptions] : []),
			format: toTitle
		},
		{
			label: 'Type',
			options: typeOptions,
			selected: selectedTypes,
			toggle: (option, checked) => (selectedTypes = toggleValue(option, selectedTypes, checked)),
			setAll: (checked) => (selectedTypes = checked ? [...typeOptions] : []),
			format: toTitle
		},
		{
			label: 'Platform',
			options: platformOptions,
			selected: selectedPlatforms,
			toggle: (option, checked) =>
				(selectedPlatforms = toggleValue(option, selectedPlatforms, checked)),
			setAll: (checked) => (selectedPlatforms = checked ? [...platformOptions] : []),
			format: toTitle
		},
		{
			label: 'Language',
			options: languageOptions,
			selected: selectedLanguages,
			toggle: (option, checked) =>
				(selectedLanguages = toggleValue(option, selectedLanguages, checked)),
			setAll: (checked) => (selectedLanguages = checked ? [...languageOptions] : []),
			format: toTitle
		},
		{
			label: 'Chat',
			options: chatOptions,
			selected: selectedChats,
			toggle: (option, checked) => (selectedChats = toggleValue(option, selectedChats, checked)),
			setAll: (checked) => (selectedChats = checked ? [...chatOptions] : []),
			format: (value) => value
		}
	]);
</script>

<div class="mb-5 flex flex-wrap items-start gap-2 lg:flex-col">
	<div class="flex w-full items-center justify-between gap-2 lg:mb-1">
		<h2 class="text-sm font-semibold text-base-content/70">Filters</h2>
		<button type="button" class="btn btn-ghost btn-xs" onclick={resetAll}>Reset all</button>
	</div>

	<!-- Search -->
	<div class="w-full">
		<div class="join w-full">
			<input
				type="text"
				class="input input-sm join-item w-full"
				class:input-error={searchMode === 'regex' && !!searchError}
				placeholder={searchMode === 'text' ? 'Search content…' : 'RegEx (content)…'}
				bind:value={searchQuery}
			/>
			{#if searchQuery}
				<button
					type="button"
					class="btn btn-sm join-item btn-ghost"
					aria-label="Clear search"
					onclick={() => (searchQuery = '')}>✕</button
				>
			{/if}
			<button
				type="button"
				class="btn btn-sm join-item font-mono"
				class:btn-primary={searchMode === 'regex'}
				class:btn-ghost={searchMode === 'text'}
				aria-label="Toggle RegEx mode"
				title={searchMode === 'text' ? 'Switch to RegEx mode' : 'Switch to text search'}
				onclick={() => (searchMode = searchMode === 'text' ? 'regex' : 'text')}>.*</button
			>
		</div>
		{#if searchMode === 'regex' && searchError}
			<p class="mt-1 text-xs text-error" role="alert">{searchError}</p>
		{:else if searchQuery.trim() && searchError === null}
			<p class="mt-1 text-xs text-base-content/50">
				{searchMatchCount} match{searchMatchCount === 1 ? '' : 'es'} in dataset
			</p>
		{/if}
	</div>

	{#each filters as filter (filter.label)}
		<div class="dropdown lg:w-full">
			<div
				tabindex="0"
				role="button"
				class="btn w-full justify-between btn-outline btn-sm font-normal"
			>
				<span>{filter.label}</span>
				<span
					class="badge badge-sm"
					class:badge-primary={filter.selected.length > 0 &&
						filter.selected.length < filter.options.length}
					class:badge-ghost={filter.selected.length === filter.options.length}
					class:badge-error={filter.selected.length === 0}
				>
					{filter.selected.length}/{filter.options.length}
				</span>
			</div>
			<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
			<div
				tabindex="0"
				class="dropdown-content z-10 mt-1 w-56 rounded-box border border-base-300 bg-base-100 p-2 shadow-lg"
			>
				<div class="mb-1 flex gap-1">
					<button
						type="button"
						class="btn grow btn-ghost btn-xs"
						onclick={() => filter.setAll(true)}
					>
						All
					</button>
					<button
						type="button"
						class="btn grow btn-ghost btn-xs"
						onclick={() => filter.setAll(false)}
					>
						None
					</button>
				</div>
				<ul class="max-h-64 overflow-y-auto">
					{#each filter.options as option (option)}
						<li>
							<label class="label cursor-pointer justify-start gap-2 py-1">
								<input
									type="checkbox"
									class="checkbox checkbox-xs checkbox-primary"
									checked={filter.selected.includes(option)}
									onchange={(event) =>
										filter.toggle(option, (event.currentTarget as HTMLInputElement).checked)}
								/>
								<span class="text-sm">{filter.format(option)}</span>
							</label>
						</li>
					{/each}
				</ul>
			</div>
		</div>
	{/each}
</div>
