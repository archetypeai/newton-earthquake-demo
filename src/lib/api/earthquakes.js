export async function fetchEarthquakes(feed = 'all_day') {
	const res = await fetch(`/api/earthquakes?feed=${feed}`);
	if (!res.ok) throw new Error('Failed to fetch earthquakes');
	return res.json();
}

export async function analyzeEarthquakes(query, feed = 'all_day') {
	const res = await fetch('/api/analyze', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ query, feed })
	});
	if (!res.ok) {
		const err = await res.json().catch(() => ({}));
		throw new Error(err.error || 'Analysis failed');
	}
	return res.json();
}
