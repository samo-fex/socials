import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertChannelSchema, insertVideoSchema, insertAiConfigSchema } from "@shared/schema";
import { z } from "zod";
import {
  generateChannelStrategy,
  generateVideoScript,
  generateVideoMetadata,
  generateContentStrategy,
  generateChannelSettings,
  generateVideoSettings,
  aiWebSearch,
} from "./ai-service";
import { fetchYouTubeChannel, searchYouTubeVideos } from "./youtube-service";

function validateBody<T>(schema: z.ZodSchema<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    const message = result.error.errors.map(e => `${e.path.join(".")}: ${e.message}`).join(", ");
    throw Object.assign(new Error(message), { status: 400 });
  }
  return result.data;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // AI Configs
  app.get("/api/ai-configs", async (_req, res) => {
    const configs = await storage.getAiConfigs();
    res.json(configs);
  });

  app.post("/api/ai-configs", async (req, res) => {
    try {
      const data = validateBody(insertAiConfigSchema, req.body);
      const config = await storage.createAiConfig(data);
      res.json(config);
    } catch (err: any) {
      res.status(err.status || 500).json({ message: err.message });
    }
  });

  app.patch("/api/ai-configs/:id", async (req, res) => {
    try {
      const data = validateBody(insertAiConfigSchema.partial(), req.body);
      if (data.isActive) {
        const allConfigs = await storage.getAiConfigs();
        for (const c of allConfigs) {
          if (c.id !== req.params.id && c.isActive) {
            await storage.updateAiConfig(c.id, { isActive: false });
          }
        }
      }
      const updated = await storage.updateAiConfig(req.params.id, data);
      if (!updated) return res.status(404).json({ message: "Config not found" });
      res.json(updated);
    } catch (err: any) {
      res.status(err.status || 500).json({ message: err.message });
    }
  });

  app.delete("/api/ai-configs/:id", async (req, res) => {
    await storage.deleteAiConfig(req.params.id);
    res.json({ success: true });
  });

  // Channels
  app.get("/api/channels", async (_req, res) => {
    const allChannels = await storage.getChannels();
    res.json(allChannels);
  });

  app.get("/api/channels/:id", async (req, res) => {
    const channel = await storage.getChannel(req.params.id);
    if (!channel) return res.status(404).json({ message: "Channel not found" });
    res.json(channel);
  });

  app.post("/api/channels", async (req, res) => {
    try {
      const data = validateBody(insertChannelSchema, req.body);
      const channel = await storage.createChannel(data);
      res.json(channel);
    } catch (err: any) {
      res.status(err.status || 500).json({ message: err.message });
    }
  });

  app.patch("/api/channels/:id", async (req, res) => {
    try {
      const data = validateBody(insertChannelSchema.partial(), req.body);
      const updated = await storage.updateChannel(req.params.id, data);
      if (!updated) return res.status(404).json({ message: "Channel not found" });
      res.json(updated);
    } catch (err: any) {
      res.status(err.status || 500).json({ message: err.message });
    }
  });

  app.delete("/api/channels/:id", async (req, res) => {
    await storage.deleteChannel(req.params.id);
    res.json({ success: true });
  });

  app.post("/api/channels/:id/generate-strategy", async (req, res) => {
    try {
      const channel = await storage.getChannel(req.params.id);
      if (!channel) return res.status(404).json({ message: "Channel not found" });

      const strategy = await generateChannelStrategy(
        channel.name,
        channel.niche,
        channel.description,
        channel.keywords || []
      );

      const updated = await storage.updateChannel(req.params.id, { strategy });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Videos
  app.get("/api/videos", async (_req, res) => {
    const allVideos = await storage.getVideos();
    res.json(allVideos);
  });

  app.get("/api/channels/:channelId/videos", async (req, res) => {
    const vids = await storage.getVideosByChannel(req.params.channelId);
    res.json(vids);
  });

  app.get("/api/videos/:id", async (req, res) => {
    const video = await storage.getVideo(req.params.id);
    if (!video) return res.status(404).json({ message: "Video not found" });
    res.json(video);
  });

  app.post("/api/videos", async (req, res) => {
    try {
      const data = validateBody(insertVideoSchema, req.body);
      const video = await storage.createVideo(data);
      res.json(video);
    } catch (err: any) {
      res.status(err.status || 500).json({ message: err.message });
    }
  });

  app.patch("/api/videos/:id", async (req, res) => {
    try {
      const data = validateBody(insertVideoSchema.partial(), req.body);
      const updated = await storage.updateVideo(req.params.id, data);
      if (!updated) return res.status(404).json({ message: "Video not found" });
      res.json(updated);
    } catch (err: any) {
      res.status(err.status || 500).json({ message: err.message });
    }
  });

  app.delete("/api/videos/:id", async (req, res) => {
    await storage.deleteVideo(req.params.id);
    res.json({ success: true });
  });

  app.post("/api/videos/:id/generate-script", async (req, res) => {
    try {
      const video = await storage.getVideo(req.params.id);
      if (!video) return res.status(404).json({ message: "Video not found" });

      const channel = await storage.getChannel(video.channelId);

      const script = await generateVideoScript(
        video.title,
        video.description || video.title,
        channel?.niche || "",
        "conversational",
        "medium",
        video.notes || "",
        channel?.strategy || ""
      );

      const updated = await storage.updateVideo(req.params.id, { script, status: "scripted" });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/videos/:id/generate-metadata", async (req, res) => {
    try {
      const video = await storage.getVideo(req.params.id);
      if (!video) return res.status(404).json({ message: "Video not found" });

      const channel = await storage.getChannel(video.channelId);

      const metadata = await generateVideoMetadata(
        video.title,
        video.description || "",
        channel?.niche || ""
      );

      const updated = await storage.updateVideo(req.params.id, {
        title: metadata.title,
        description: metadata.description,
        keywords: metadata.keywords,
        tags: metadata.tags,
        thumbnailIdea: metadata.thumbnailIdea,
      });

      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // YouTube Analyzer
  const querySchema = z.object({ query: z.string().min(1, "Query is required") });

  app.post("/api/analyze/channel", async (req, res) => {
    try {
      const { query } = validateBody(querySchema, req.body);
      const youtubeKey = process.env.YOUTUBE_API_KEY;

      if (!youtubeKey) {
        return res.status(400).json({
          message: "YouTube API key not configured. Add YOUTUBE_API_KEY as an environment secret."
        });
      }

      const result = await fetchYouTubeChannel(youtubeKey, query);

      await storage.createAnalysis({
        type: "channel",
        query,
        result,
        source: "youtube_api",
      });

      res.json(result);
    } catch (err: any) {
      res.status(err.status || 500).json({ message: err.message });
    }
  });

  app.post("/api/analyze/videos", async (req, res) => {
    try {
      const { query } = validateBody(querySchema, req.body);
      const youtubeKey = process.env.YOUTUBE_API_KEY;

      if (!youtubeKey) {
        return res.status(400).json({
          message: "YouTube API key not configured. Add YOUTUBE_API_KEY as an environment secret."
        });
      }

      const result = await searchYouTubeVideos(youtubeKey, query);

      await storage.createAnalysis({
        type: "video_search",
        query,
        result,
        source: "youtube_api",
      });

      res.json(result);
    } catch (err: any) {
      res.status(err.status || 500).json({ message: err.message });
    }
  });

  app.post("/api/analyze/web-search", async (req, res) => {
    try {
      const { query } = validateBody(querySchema, req.body);
      const analysis = await aiWebSearch(query);

      await storage.createAnalysis({
        type: "web_search",
        query,
        result: { analysis },
        source: "ai_search",
      });

      res.json({ analysis });
    } catch (err: any) {
      res.status(err.status || 500).json({ message: err.message });
    }
  });

  // Content Strategist
  const strategistSchema = z.object({
    channelId: z.string().optional(),
    niche: z.string().optional(),
    goals: z.string().optional(),
  });

  app.post("/api/strategist/generate", async (req, res) => {
    try {
      const { channelId, niche, goals } = validateBody(strategistSchema, req.body);
      let channelName, channelDescription, channelNiche;

      if (channelId && channelId !== "none") {
        const channel = await storage.getChannel(channelId);
        if (channel) {
          channelName = channel.name;
          channelDescription = channel.description;
          channelNiche = channel.niche;
        }
      }

      const strategy = await generateContentStrategy(
        niche || channelNiche || "General",
        goals || "",
        channelName,
        channelDescription
      );

      if (channelId && channelId !== "none") {
        await storage.updateChannel(channelId, { strategy });
      }

      res.json({ strategy });
    } catch (err: any) {
      res.status(err.status || 500).json({ message: err.message });
    }
  });

  // Script Writer
  const scriptSchema = z.object({
    channelId: z.string().optional(),
    title: z.string().min(1, "Title is required"),
    topic: z.string().optional(),
    tone: z.string().optional(),
    length: z.string().optional(),
    additionalNotes: z.string().optional(),
  });

  app.post("/api/script-writer/generate", async (req, res) => {
    try {
      const { channelId, title, topic, tone, length, additionalNotes } = validateBody(scriptSchema, req.body);
      let channelNiche = "", channelStrategy = "";

      if (channelId && channelId !== "none") {
        const channel = await storage.getChannel(channelId);
        if (channel) {
          channelNiche = channel.niche;
          channelStrategy = channel.strategy || "";
        }
      }

      const script = await generateVideoScript(
        title,
        topic || title,
        channelNiche,
        tone || "conversational",
        length || "medium",
        additionalNotes || "",
        channelStrategy
      );

      res.json({ script });
    } catch (err: any) {
      res.status(err.status || 500).json({ message: err.message });
    }
  });

  // Settings Generator
  const channelSettingsSchema = z.object({
    name: z.string().min(1, "Name is required"),
    niche: z.string().min(1, "Niche is required"),
    goals: z.string().optional(),
  });

  app.post("/api/settings-generator/channel", async (req, res) => {
    try {
      const { name, niche, goals } = validateBody(channelSettingsSchema, req.body);
      const result = await generateChannelSettings(name, niche, goals || "");
      res.json(result);
    } catch (err: any) {
      res.status(err.status || 500).json({ message: err.message });
    }
  });

  const videoSettingsSchema = z.object({
    channelId: z.string().optional(),
    title: z.string().min(1, "Title is required"),
    topic: z.string().optional(),
  });

  app.post("/api/settings-generator/video", async (req, res) => {
    try {
      const { channelId, title, topic } = validateBody(videoSettingsSchema, req.body);
      let channelNiche = "";

      if (channelId && channelId !== "none") {
        const channel = await storage.getChannel(channelId);
        if (channel) channelNiche = channel.niche;
      }

      const result = await generateVideoSettings(title, topic || "", channelNiche);
      res.json(result);
    } catch (err: any) {
      res.status(err.status || 500).json({ message: err.message });
    }
  });

  return httpServer;
}
