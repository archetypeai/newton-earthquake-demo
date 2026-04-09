<script>
	import { cn } from '$lib/utils.js';
	import { Button } from '$lib/components/ui/primitives/button/index.js';
	import Badge from '$lib/components/ui/primitives/badge/index.js';

	const FEEDS = [
		{ id: 'all_hour', label: 'Past Hour', mag: 'All' },
		{ id: 'all_day', label: 'Past 24h', mag: 'All' },
		{ id: '2.5_day', label: 'Past 24h', mag: 'M2.5+' },
		{ id: '4.5_week', label: 'Past 7d', mag: 'M4.5+' },
		{ id: 'significant_week', label: 'Past 7d', mag: 'Significant' }
	];

	let { selected = $bindable('all_day'), onchange, class: className, ...restProps } = $props();
</script>

<div class={cn('flex flex-wrap gap-2', className)} {...restProps}>
	{#each FEEDS as feed (feed.id)}
		<Button
			variant={selected === feed.id ? 'default' : 'outline'}
			size="sm"
			onclick={() => {
				selected = feed.id;
				onchange?.(feed.id);
			}}
		>
			{feed.label}
			<Badge variant="outline" class="text-[10px] ml-1 px-1 py-0 opacity-70">
				{feed.mag}
			</Badge>
		</Button>
	{/each}
</div>
