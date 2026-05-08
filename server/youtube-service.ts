interface YouTubeChannelData {
  title: string;
  description: string;
  subscriberCount: string;
  videoCount: string;
  viewCount: string;
  publishedAt: string;
  thumbnailUrl: string;
  customUrl: string;
}

interface YouTubeVideoData {
  title: string;
  description: string;
  viewCount: string;
  likeCount: string;
  commentCount: string;
  publishedAt: string;
  thumbnailUrl: string;
  channelTitle: string;
  tags: string[];
  videoId: string;
}

export async function fetchYouTubeChannel(apiKey: string, query: string): Promise<YouTubeChannelData> {
  let channelId = query;

  if (!query.startsWith("UC")) {
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=channel&maxResults=1&key=${apiKey}`;
    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) {
      const err = await searchRes.text();
      throw new Error(`YouTube API error: ${err}`);
    }
    const searchData = await searchRes.json();
    if (!searchData.items || searchData.items.length === 0) {
      throw new Error("No channel found for this query");
    }
    channelId = searchData.items[0].snippet.channelId;
  }

  const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`YouTube API error: ${err}`);
  }

  const data = await res.json();
  if (!data.items || data.items.length === 0) {
    throw new Error("Channel not found");
  }

  const channel = data.items[0];
  return {
    title: channel.snippet.title,
    description: channel.snippet.description,
    subscriberCount: channel.statistics.subscriberCount || "0",
    videoCount: channel.statistics.videoCount || "0",
    viewCount: channel.statistics.viewCount || "0",
    publishedAt: channel.snippet.publishedAt,
    thumbnailUrl: channel.snippet.thumbnails?.medium?.url || "",
    customUrl: channel.snippet.customUrl || "",
  };
}

export async function searchYouTubeVideos(apiKey: string, query: string): Promise<{ videos: YouTubeVideoData[] }> {
  const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=10&order=relevance&key=${apiKey}`;
  const searchRes = await fetch(searchUrl);
  if (!searchRes.ok) {
    const err = await searchRes.text();
    throw new Error(`YouTube API error: ${err}`);
  }

  const searchData = await searchRes.json();
  if (!searchData.items || searchData.items.length === 0) {
    return { videos: [] };
  }

  const videoIds = searchData.items.map((item: any) => item.id.videoId).join(",");
  const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoIds}&key=${apiKey}`;
  const statsRes = await fetch(statsUrl);

  if (!statsRes.ok) {
    const err = await statsRes.text();
    throw new Error(`YouTube API error: ${err}`);
  }

  const statsData = await statsRes.json();

  const videos: YouTubeVideoData[] = statsData.items.map((item: any) => ({
    title: item.snippet.title,
    description: item.snippet.description,
    viewCount: item.statistics?.viewCount || "0",
    likeCount: item.statistics?.likeCount || "0",
    commentCount: item.statistics?.commentCount || "0",
    publishedAt: item.snippet.publishedAt,
    thumbnailUrl: item.snippet.thumbnails?.medium?.url || "",
    channelTitle: item.snippet.channelTitle,
    tags: item.snippet.tags || [],
    videoId: item.id,
  }));

  return { videos };
}
