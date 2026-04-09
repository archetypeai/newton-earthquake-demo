<script>
	import { cn } from '$lib/utils.js';
	import BackgroundCard from '$lib/components/ui/patterns/background-card/index.js';
	import { Button } from '$lib/components/ui/primitives/button/index.js';
	import { ScrollArea } from '$lib/components/ui/primitives/scroll-area/index.js';
	import TrendingUpIcon from '@lucide/svelte/icons/trending-up';
	import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';
	import SpinnerIcon from '@lucide/svelte/icons/loader';

	let { loading = false, ongenerate, class: className, ...restProps } = $props();

	let forecast = $state(null);
	let generatedAt = $state(null);

	export function setForecast(text, timestamp) {
		forecast = text;
		generatedAt = timestamp;
	}
</script>

<BackgroundCard
	title="Risk Forecast"
	icon={TrendingUpIcon}
	class={cn('flex max-h-full flex-col gap-3 overflow-hidden', className)}
	{...restProps}
>
	{#if !forecast && !loading}
		<div class="flex flex-1 flex-col items-center justify-center gap-4 py-8">
			<p class="text-muted-foreground text-center text-sm">
				Analyze current seismic data to identify regions with elevated risk of continued or
				escalating activity.
			</p>
			<Button variant="default" onclick={ongenerate}>
				<TrendingUpIcon class="size-4" aria-hidden="true" />
				Generate Forecast
			</Button>
		</div>
	{:else}
		<div class="flex items-center justify-between">
			{#if generatedAt}
				<span class="text-muted-foreground font-mono text-[10px]">
					Generated {new Date(generatedAt).toLocaleTimeString('en-US', {
						hour12: false,
						hour: '2-digit',
						minute: '2-digit',
						second: '2-digit'
					})}
				</span>
			{/if}
			<Button
				variant="outline"
				size="sm"
				disabled={loading}
				onclick={ongenerate}
			>
				{#if loading}
					<SpinnerIcon class="size-3 animate-spin" />
				{:else}
					<RefreshCwIcon class="size-3" />
				{/if}
				Refresh
			</Button>
		</div>

		<ScrollArea class="min-h-0 flex-1">
			<div class="pr-3">
				{#if loading && !forecast}
					<div class="flex items-center gap-2 py-8">
						<SpinnerIcon class="text-muted-foreground size-4 animate-spin" />
						<span class="text-muted-foreground text-sm">Analyzing seismic patterns...</span>
					</div>
				{:else if forecast}
					<p class="text-foreground text-sm leading-relaxed whitespace-pre-wrap">{forecast}</p>
				{/if}
			</div>
		</ScrollArea>
	{/if}
</BackgroundCard>
