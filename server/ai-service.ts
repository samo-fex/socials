import { storage } from "./storage";

interface AiResponse {
  text: string;
}

async function callGoogleAI(apiKey: string, model: string, prompt: string, temperature: number): Promise<AiResponse> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google AI API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return { text };
}

async function callOpenRouter(apiKey: string, model: string, prompt: string, temperature: number): Promise<AiResponse> {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://tubeforge.replit.app",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content || "";
  return { text };
}

export async function generateAIContent(prompt: string): Promise<string> {
  const config = await storage.getActiveAiConfig();
  if (!config || !config.apiKey) {
    throw new Error("No AI provider configured. Please add your API key in AI Configuration.");
  }

  let result: AiResponse;
  if (config.provider === "google") {
    result = await callGoogleAI(config.apiKey, config.model, prompt, config.temperature);
  } else if (config.provider === "openrouter") {
    result = await callOpenRouter(config.apiKey, config.model, prompt, config.temperature);
  } else {
    throw new Error(`Unknown AI provider: ${config.provider}`);
  }

  return result.text;
}

export async function generateChannelStrategy(name: string, niche: string, description: string, keywords: string[]): Promise<string> {
  const prompt = `You are a YouTube content strategist. Create a comprehensive content strategy for a YouTube channel with the following details:

Channel Name: ${name}
Niche: ${niche}
Description: ${description}
Keywords: ${keywords.join(", ")}

Please provide a detailed strategy covering:
1. **Channel Positioning** - Unique value proposition and target audience
2. **Content Pillars** - 3-5 core content categories
3. **Upload Schedule** - Recommended frequency and best times
4. **Video Format Ideas** - 10 video ideas with titles
5. **Growth Tactics** - SEO, collaborations, community building
6. **Monetization Plan** - Revenue streams and milestones
7. **First 30 Days Plan** - Step-by-step launch strategy
8. **Competitor Analysis Tips** - How to research and differentiate

Be specific, actionable, and data-driven in your recommendations.`;

  return generateAIContent(prompt);
}

export async function generateVideoScript(
  title: string,
  topic: string,
  channelNiche: string,
  tone: string,
  length: string,
  additionalNotes: string,
  channelStrategy: string
): Promise<string> {
  const lengthGuide: Record<string, string> = {
    short: "3-5 minutes (approximately 600-1000 words)",
    medium: "8-12 minutes (approximately 1600-2400 words)",
    long: "15-20 minutes (approximately 3000-4000 words)",
    extended: "25+ minutes (approximately 5000+ words)",
  };

  const prompt = `You are a professional YouTube ghost script writer. Write a complete video script with the following parameters:

Title: ${title}
Topic: ${topic}
Channel Niche: ${channelNiche || "General"}
Tone: ${tone}
Target Length: ${lengthGuide[length] || lengthGuide.medium}
${additionalNotes ? `Additional Notes: ${additionalNotes}` : ""}
${channelStrategy ? `Channel Strategy Context: ${channelStrategy.substring(0, 500)}` : ""}

Structure the script with:
1. **HOOK** (First 30 seconds) - Attention-grabbing opening
2. **INTRO** - Brief introduction and what viewers will learn
3. **MAIN CONTENT** - Well-organized sections with clear transitions
4. **CTA** - Call to action (subscribe, like, comment)
5. **OUTRO** - Memorable closing

Include:
- [B-ROLL] suggestions in brackets
- [GRAPHICS] or [TEXT ON SCREEN] notes
- Natural speaking language (not robotic)
- Engagement hooks throughout
- Timestamps/chapters suggestions at the end

Write the script in a ${tone} tone that feels natural when spoken aloud.`;

  return generateAIContent(prompt);
}

export async function generateVideoMetadata(
  title: string,
  description: string,
  channelNiche: string
): Promise<{ title: string; description: string; keywords: string[]; tags: string[]; thumbnailIdea: string }> {
  const prompt = `You are a YouTube SEO expert. Generate optimized metadata for a YouTube video:

Current Title: ${title}
Current Description: ${description}
Channel Niche: ${channelNiche || "General"}

Respond ONLY with a valid JSON object (no markdown, no code blocks, no extra text):
{
  "title": "SEO-optimized title (max 100 chars, include power words)",
  "description": "Full YouTube description (500-1000 chars) with relevant links placeholders, timestamps, and SEO keywords naturally integrated",
  "keywords": ["keyword1", "keyword2", "...up to 15 relevant keywords"],
  "tags": ["tag1", "tag2", "...up to 20 relevant tags for YouTube"],
  "thumbnailIdea": "Detailed thumbnail concept description"
}`;

  const result = await generateAIContent(prompt);
  try {
    const cleaned = result.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return {
      title: title,
      description: description,
      keywords: [],
      tags: [],
      thumbnailIdea: "Could not parse AI response",
    };
  }
}

export async function generateContentStrategy(
  niche: string,
  goals: string,
  channelName?: string,
  channelDescription?: string
): Promise<string> {
  const prompt = `You are an expert YouTube content strategist. Create a detailed content strategy:

${channelName ? `Channel: ${channelName}` : ""}
Niche: ${niche}
${goals ? `Goals: ${goals}` : ""}
${channelDescription ? `Channel Description: ${channelDescription}` : ""}

Provide a comprehensive strategy including:
1. **Audience Analysis** - Target demographics and psychographics
2. **Content Calendar** - Monthly content plan with specific video ideas
3. **Keyword Strategy** - Top 20 keywords to target
4. **Trending Topics** - Current trends in this niche to leverage
5. **Content Mix** - Ratio of educational, entertainment, and promotional content
6. **Thumbnail Strategy** - Visual branding guidelines
7. **Title Formulas** - 5 proven title templates for this niche
8. **Hook Templates** - 5 opening hook scripts
9. **Growth Milestones** - 30-day, 90-day, and 6-month goals
10. **Engagement Strategy** - Community building and audience retention tactics

Be specific, data-driven, and actionable.`;

  return generateAIContent(prompt);
}

export async function generateChannelSettings(
  name: string,
  niche: string,
  goals: string
): Promise<{ description: string; keywords: string[]; tagline: string; about: string }> {
  const prompt = `You are a YouTube channel optimization expert. Generate settings for this channel:

Channel Name: ${name}
Niche: ${niche}
${goals ? `Goals: ${goals}` : ""}

Respond ONLY with a valid JSON object (no markdown, no code blocks):
{
  "description": "Channel description optimized for YouTube SEO (150-300 chars)",
  "keywords": ["keyword1", "keyword2", "...up to 20 channel keywords"],
  "tagline": "Short catchy tagline for the channel",
  "about": "Full About section text (500+ chars) with SEO keywords naturally integrated, links placeholders, and upload schedule"
}`;

  const result = await generateAIContent(prompt);
  try {
    const cleaned = result.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return {
      description: "",
      keywords: [],
      tagline: "",
      about: "Could not parse AI response",
    };
  }
}

export async function generateVideoSettings(
  title: string,
  topic: string,
  channelNiche?: string
): Promise<{ title: string; description: string; keywords: string[]; tags: string[]; thumbnailIdea: string }> {
  return generateVideoMetadata(title, topic, channelNiche || "");
}

export async function aiWebSearch(query: string): Promise<string> {
  const prompt = `You are a YouTube research analyst. The user wants to research the following topic for their YouTube channel:

"${query}"

Provide a comprehensive analysis including:
1. **Overview** - Summary of the topic/trend
2. **Key Findings** - Important data points and insights
3. **Competitor Channels** - Notable channels in this space (mention specific names if you know them)
4. **Content Opportunities** - Gaps and opportunities for new creators
5. **Recommended Strategy** - How to approach this topic on YouTube
6. **Trending Angles** - Current trending sub-topics
7. **Audience Insights** - Who is searching for this content
8. **Monetization Potential** - Revenue opportunities in this niche

Provide actionable, specific insights based on your knowledge of YouTube trends and creator strategies.`;

  return generateAIContent(prompt);
}
