interface SearchRequest {
  query: string;
}

interface YouTubeSearchItem {
  id: { videoId: string };
  snippet: {
    title: string;
    channelTitle: string;
  };
}

export default async function handler(req: Request): Promise<Response> {
  try {
    const body: SearchRequest = await req.json();
    const query = body?.query?.trim();

    if (!query) {
      return Response.json({ results: [] });
    }

    const apiKey = Deno.env.get("YOUTUBE_API_KEY");
    if (!apiKey) {
      return Response.json({ error: "YouTube API key not configured" }, { status: 500 });
    }

    const url = new URL("https://www.googleapis.com/youtube/v3/search");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("type", "video");
    url.searchParams.set("videoEmbeddable", "true");
    url.searchParams.set("maxResults", "15");
    url.searchParams.set("q", query);
    url.searchParams.set("key", apiKey);

    const response = await fetch(url.toString(), {
      signal: AbortSignal.timeout(10000),
      headers: { "Accept": "application/json" },
    });

    const data = await response.json();

    if (!response.ok) {
      return Response.json(
        { error: data?.error?.message || "YouTube API error" },
        { status: response.status }
      );
    }

    const results = (data.items || [])
      .filter((item: YouTubeSearchItem) => item.id?.videoId)
      .map((item: YouTubeSearchItem) => ({
        videoId: item.id.videoId,
        title: item.snippet?.title || "Unknown",
        channelTitle: item.snippet?.channelTitle || "",
        thumbnail: `https://img.youtube.com/vi/${item.id.videoId}/default.jpg`,
      }));

    return Response.json({ results });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}