<script>
	import { cn } from '$lib/utils.js';
	import BackgroundCard from '$lib/components/ui/patterns/background-card/index.js';
	import { Button } from '$lib/components/ui/primitives/button/index.js';
	import { ScrollArea } from '$lib/components/ui/primitives/scroll-area/index.js';
	import MessageSquareIcon from '@lucide/svelte/icons/message-square';
	import SendIcon from '@lucide/svelte/icons/send';
	import SpinnerIcon from '@lucide/svelte/icons/loader';
	import TrendingUpIcon from '@lucide/svelte/icons/trending-up';
	import CrosshairIcon from '@lucide/svelte/icons/crosshair';
	import BarChartIcon from '@lucide/svelte/icons/bar-chart-3';

	const QUICK_PROMPTS = [
		{
			label: 'Risk Forecast',
			icon: TrendingUpIcon,
			query:
				'Based on the current seismic data, which regions are most likely to see continued or escalating seismic activity in the next 24-48 hours? ' +
				'Consider active aftershock sequences, spatial clustering, historical patterns, and fault line proximity. ' +
				'Rank the top 3-5 regions by risk level and explain your reasoning for each.'
		},
		{
			label: 'Aftershocks',
			icon: CrosshairIcon,
			query: 'Identify any aftershock sequences in the current data. For each sequence, list the mainshock and its aftershocks, and assess whether the sequence is winding down or still active.'
		},
		{
			label: 'Summary',
			icon: BarChartIcon,
			query: 'Give a concise summary of current global seismic activity. Highlight the most significant events, most active regions, and anything unusual compared to normal baseline activity.'
		}
	];

	let {
		messages = $bindable([]),
		loading = false,
		onsend,
		class: className,
		...restProps
	} = $props();

	let inputValue = $state('');
	let textareaRef = $state(null);

	function autoResize() {
		if (!textareaRef) return;
		textareaRef.style.height = 'auto';
		textareaRef.style.height = Math.min(textareaRef.scrollHeight, 120) + 'px';
	}

	function handleSubmit(e) {
		e.preventDefault();
		const text = inputValue.trim();
		if (!text || loading) return;
		inputValue = '';
		if (textareaRef) textareaRef.style.height = 'auto';
		onsend?.(text);
	}

	function handleKeydown(e) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSubmit(e);
		}
	}
</script>

<BackgroundCard
	title="Chat"
	icon={MessageSquareIcon}
	class={cn('flex max-h-full flex-col gap-3 overflow-hidden', className)}
	{...restProps}
>
	<ScrollArea class="min-h-0 flex-1">
		<div class="flex flex-col gap-3 pr-3">
			{#if messages.length === 0}
				<div class="flex flex-col items-center gap-3 py-6">
					<p class="text-muted-foreground text-center text-sm">
						Ask Newton about seismic activity
					</p>
					<div class="flex flex-wrap justify-center gap-1.5">
						{#each QUICK_PROMPTS as prompt}
							<Button
								variant="outline"
								size="sm"
								disabled={loading}
								onclick={() => onsend?.(prompt.query)}
							>
								<prompt.icon class="size-3" aria-hidden="true" />
								{prompt.label}
							</Button>
						{/each}
					</div>
				</div>
			{:else}
				{#each messages as msg (msg.id)}
					<div
						class={cn(
							'rounded-md px-3 py-2 text-sm',
							msg.role === 'user'
								? 'bg-secondary text-secondary-foreground ml-8'
								: 'bg-atai-neutral/10 text-foreground mr-8 border border-atai-neutral/20'
						)}
					>
						<p class="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
						<span class="text-[10px] opacity-50">
							{new Date(msg.timestamp).toLocaleTimeString('en-US', {
								hour12: false,
								hour: '2-digit',
								minute: '2-digit'
							})}
						</span>
					</div>
				{/each}
				{#if loading}
					<div class="bg-muted mr-8 flex items-center gap-2 rounded-md px-3 py-2">
						<SpinnerIcon class="text-muted-foreground size-4 animate-spin" />
						<span class="text-muted-foreground text-sm">Analyzing...</span>
					</div>
				{/if}
			{/if}
		</div>
	</ScrollArea>

	<form class="flex items-end gap-2" onsubmit={handleSubmit}>
		<textarea
			bind:this={textareaRef}
			bind:value={inputValue}
			oninput={autoResize}
			onkeydown={handleKeydown}
			placeholder="Ask about earthquakes..."
			rows="1"
			class={cn(
				'border-input bg-transparent ring-ring/50 placeholder:text-muted-foreground flex-1 resize-none rounded-xs border px-3 py-2 text-sm outline-none transition-colors',
				'focus-visible:border-ring focus-visible:ring-[3px]'
			)}
		></textarea>
		<Button
			type="submit"
			size="icon"
			disabled={loading || !inputValue.trim()}
			aria-label="Send message"
		>
			<SendIcon class="size-4" />
		</Button>
	</form>
</BackgroundCard>
