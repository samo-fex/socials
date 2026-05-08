import {
  type AiConfig, type InsertAiConfig,
  type Channel, type InsertChannel,
  type Video, type InsertVideo,
  type Analysis, type InsertAnalysis,
  aiConfigs, channels, videos, analyses,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getAiConfigs(): Promise<AiConfig[]>;
  getActiveAiConfig(): Promise<AiConfig | undefined>;
  getAiConfig(id: string): Promise<AiConfig | undefined>;
  createAiConfig(config: InsertAiConfig): Promise<AiConfig>;
  updateAiConfig(id: string, data: Partial<InsertAiConfig>): Promise<AiConfig | undefined>;
  deleteAiConfig(id: string): Promise<void>;

  getChannels(): Promise<Channel[]>;
  getChannel(id: string): Promise<Channel | undefined>;
  createChannel(channel: InsertChannel): Promise<Channel>;
  updateChannel(id: string, data: Partial<InsertChannel>): Promise<Channel | undefined>;
  deleteChannel(id: string): Promise<void>;

  getVideos(): Promise<Video[]>;
  getVideosByChannel(channelId: string): Promise<Video[]>;
  getVideo(id: string): Promise<Video | undefined>;
  createVideo(video: InsertVideo): Promise<Video>;
  updateVideo(id: string, data: Partial<InsertVideo>): Promise<Video | undefined>;
  deleteVideo(id: string): Promise<void>;

  getAnalyses(): Promise<Analysis[]>;
  createAnalysis(analysis: InsertAnalysis): Promise<Analysis>;
}

export class DatabaseStorage implements IStorage {
  async getAiConfigs(): Promise<AiConfig[]> {
    return db.select().from(aiConfigs);
  }

  async getActiveAiConfig(): Promise<AiConfig | undefined> {
    const [config] = await db.select().from(aiConfigs).where(eq(aiConfigs.isActive, true)).limit(1);
    return config;
  }

  async getAiConfig(id: string): Promise<AiConfig | undefined> {
    const [config] = await db.select().from(aiConfigs).where(eq(aiConfigs.id, id));
    return config;
  }

  async createAiConfig(config: InsertAiConfig): Promise<AiConfig> {
    const [created] = await db.insert(aiConfigs).values(config).returning();
    return created;
  }

  async updateAiConfig(id: string, data: Partial<InsertAiConfig>): Promise<AiConfig | undefined> {
    const [updated] = await db.update(aiConfigs).set(data).where(eq(aiConfigs.id, id)).returning();
    return updated;
  }

  async deleteAiConfig(id: string): Promise<void> {
    await db.delete(aiConfigs).where(eq(aiConfigs.id, id));
  }

  async getChannels(): Promise<Channel[]> {
    return db.select().from(channels).orderBy(desc(channels.createdAt));
  }

  async getChannel(id: string): Promise<Channel | undefined> {
    const [channel] = await db.select().from(channels).where(eq(channels.id, id));
    return channel;
  }

  async createChannel(channel: InsertChannel): Promise<Channel> {
    const [created] = await db.insert(channels).values(channel).returning();
    return created;
  }

  async updateChannel(id: string, data: Partial<InsertChannel>): Promise<Channel | undefined> {
    const [updated] = await db.update(channels).set(data).where(eq(channels.id, id)).returning();
    return updated;
  }

  async deleteChannel(id: string): Promise<void> {
    await db.delete(videos).where(eq(videos.channelId, id));
    await db.delete(channels).where(eq(channels.id, id));
  }

  async getVideos(): Promise<Video[]> {
    return db.select().from(videos).orderBy(desc(videos.createdAt));
  }

  async getVideosByChannel(channelId: string): Promise<Video[]> {
    return db.select().from(videos).where(eq(videos.channelId, channelId)).orderBy(desc(videos.createdAt));
  }

  async getVideo(id: string): Promise<Video | undefined> {
    const [video] = await db.select().from(videos).where(eq(videos.id, id));
    return video;
  }

  async createVideo(video: InsertVideo): Promise<Video> {
    const [created] = await db.insert(videos).values(video).returning();
    return created;
  }

  async updateVideo(id: string, data: Partial<InsertVideo>): Promise<Video | undefined> {
    const [updated] = await db.update(videos).set(data).where(eq(videos.id, id)).returning();
    return updated;
  }

  async deleteVideo(id: string): Promise<void> {
    await db.delete(videos).where(eq(videos.id, id));
  }

  async getAnalyses(): Promise<Analysis[]> {
    return db.select().from(analyses).orderBy(desc(analyses.createdAt)).limit(50);
  }

  async createAnalysis(analysis: InsertAnalysis): Promise<Analysis> {
    const [created] = await db.insert(analyses).values(analysis).returning();
    return created;
  }
}

export const storage = new DatabaseStorage();
