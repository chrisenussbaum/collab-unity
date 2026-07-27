import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from 'base44:runtime';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const query = (body.query || '').trim();
    if (!query) return Response.json({ error: 'Query is required' }, { status: 400 });

    const apiKey = secrets.get('YOUTUBE_API_KEY');
    if (!apiKey) return Response.json({ error: 'YouTube API key not configured' }, { status: 500 });

    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=8&videoEmbeddable=true&key=${apiKey}`;

    const resp = await fetch(searchUrl);
    if (!resp.ok) {
      const errText = await resp.text().catch(() => '');
      return Response.json({ error: `YouTube API error: ${resp.status}`, details: errText.slice(0, 300) }, { status: 502 });
    }

    const data = await resp.json();
    const videos = (data.items || []).map(item => ({
      title: item.snippet?.title || '',
      url: `https://www.youtube.com/watch?v=${item.id?.videoId || ''}`,
      videoId: item.id?.videoId || '',
      thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || '',
      channel: item.snippet?.channelTitle || '',
      description: (item.snippet?.description || '').slice(0, 200),
    }));

    return Response.json({ videos });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}