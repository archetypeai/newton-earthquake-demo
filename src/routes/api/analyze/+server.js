import { json } from '@sveltejs/kit';
import { queryNewton } from '$lib/server/newton.js';
import { fetchEarthquakes, formatEarthquakesForNewton } from '$lib/server/usgs.js';

export async function POST({ request }) {
	try {
		const { query, feed } = await request.json();
		if (!query) {
			return json({ error: 'Missing query' }, { status: 400 });
		}

		// Always use full 24h data for Newton context regardless of UI filter
		const data = await fetchEarthquakes('all_day');
		const context = formatEarthquakesForNewton(data.earthquakes);

		const fullQuery = `${context}\n\n---\n\nUser question: ${query}`;
		const analysis = await queryNewton(fullQuery);

		return json({ analysis, timestamp: Date.now(), count: data.earthquakes.length });
	} catch (err) {
		return json({ error: err.message }, { status: 500 });
	}
}
