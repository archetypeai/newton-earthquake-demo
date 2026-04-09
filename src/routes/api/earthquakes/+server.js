import { json } from '@sveltejs/kit';
import { fetchEarthquakes } from '$lib/server/usgs.js';

export async function GET({ url }) {
	const feed = url.searchParams.get('feed') || 'all_day';

	try {
		const data = await fetchEarthquakes(feed);
		return json(data);
	} catch (err) {
		return json({ error: err.message }, { status: 500 });
	}
}
