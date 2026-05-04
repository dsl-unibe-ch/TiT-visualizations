<script lang="ts">
	import type { Message } from '$lib/types';

	let {
		directionOptions,
		typeOptions,
		platformOptions,
		selectedDirections = $bindable(),
		selectedTypes = $bindable(),
		selectedPlatforms = $bindable()
	}: {
		directionOptions: Message['direction'][];
		typeOptions: string[];
		platformOptions: string[];
		selectedDirections: Message['direction'][];
		selectedTypes: string[];
		selectedPlatforms: string[];
	} = $props();

	function toggleValue<T extends string>(option: T, current: T[], checked: boolean): T[] {
		if (checked) {
			return current.includes(option) ? current : [...current, option];
		}
		return current.filter((value) => value !== option);
	}

	function toggleDirection(option: Message['direction'], checked: boolean) {
		selectedDirections = toggleValue(option, selectedDirections, checked);
	}

	function toggleType(option: string, checked: boolean) {
		selectedTypes = toggleValue(option, selectedTypes, checked);
	}

	function togglePlatform(option: string, checked: boolean) {
		selectedPlatforms = toggleValue(option, selectedPlatforms, checked);
	}

	function resetAll() {
		selectedDirections = [...directionOptions];
		selectedTypes = [...typeOptions];
		selectedPlatforms = [...platformOptions];
	}

	function toTitle(value: string): string {
		return value
			.split(' ')
			.map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
			.join(' ');
	}

	const selectionSummary = $derived([
		{ label: 'Direction', selected: selectedDirections.length, total: directionOptions.length },
		{ label: 'Type', selected: selectedTypes.length, total: typeOptions.length },
		{ label: 'Platform', selected: selectedPlatforms.length, total: platformOptions.length }
	]);
</script>

<div class="card mb-5 bg-base-200/40 card-border">
	<div class="card-body gap-4 p-4">
		<div class="flex flex-wrap items-center justify-between gap-3">
			<h2 class="card-title text-base">Filters</h2>
			<button type="button" class="btn btn-ghost btn-sm" onclick={resetAll}>Reset all</button>
		</div>

		<div class="grid gap-4 md:grid-cols-3">
			<fieldset class="fieldset rounded-box border border-base-300 bg-base-100 p-3">
				<legend class="fieldset-legend text-sm">Direction</legend>
				{#each directionOptions as option (option)}
					<label class="label cursor-pointer justify-start gap-2 py-1">
						<input
							type="checkbox"
							class="checkbox checkbox-sm checkbox-primary"
							checked={selectedDirections.includes(option)}
							onchange={(event) =>
								toggleDirection(option, (event.currentTarget as HTMLInputElement).checked)}
						/>
						<span>{toTitle(option)}</span>
					</label>
				{/each}
			</fieldset>

			<fieldset class="fieldset rounded-box border border-base-300 bg-base-100 p-3">
				<legend class="fieldset-legend text-sm">Type</legend>
				{#each typeOptions as option (option)}
					<label class="label cursor-pointer justify-start gap-2 py-1">
						<input
							type="checkbox"
							class="checkbox checkbox-sm checkbox-primary"
							checked={selectedTypes.includes(option)}
							onchange={(event) =>
								toggleType(option, (event.currentTarget as HTMLInputElement).checked)}
						/>
						<span>{toTitle(option)}</span>
					</label>
				{/each}
			</fieldset>

			<fieldset class="fieldset rounded-box border border-base-300 bg-base-100 p-3">
				<legend class="fieldset-legend text-sm">Platform</legend>
				{#each platformOptions as option (option)}
					<label class="label cursor-pointer justify-start gap-2 py-1">
						<input
							type="checkbox"
							class="checkbox checkbox-sm checkbox-primary"
							checked={selectedPlatforms.includes(option)}
							onchange={(event) =>
								togglePlatform(option, (event.currentTarget as HTMLInputElement).checked)}
						/>
						<span>{toTitle(option)}</span>
					</label>
				{/each}
			</fieldset>
		</div>

		<div class="flex flex-wrap gap-2">
			{#each selectionSummary as item (item.label)}
				<span class="badge badge-outline">
					{item.label}: {item.selected}/{item.total}
				</span>
			{/each}
		</div>
	</div>
</div>
