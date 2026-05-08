import { sql } from "drizzle-orm";
import { pgTable, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

const requiredText = (fieldName: string, maxLength: number, minLength = 1) =>
  z
    .string()
    .trim()
    .min(minLength, `${fieldName} is required`)
    .max(maxLength, `${fieldName} must be ${maxLength} characters or less`);

const optionalText = (fieldName: string, maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength, `${fieldName} must be ${maxLength} characters or less`)
    .or(z.literal(""));

const responseText = (maxLength: number) => z.string().trim().min(1).max(maxLength);

const optionalUrl = z.preprocess(
  (value) => (typeof value === "string" ? value.trim() : value),
  z.union([
    z.literal(""),
    z
      .string()
      .url("Please enter a valid URL")
      .max(2048, "Channel URL must be 2048 characters or less"),
  ]),
);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const platformOptions = [
  "youtube",
  "instagram",
  "tiktok",
  "twitter",
  "linkedin",
  "facebook",
  "twitch",
  "podcast",
  "other",
] as const;

export type Platform = (typeof platformOptions)[number];

export const analyzeChannelSchema = z.object({
  platform: z.enum(platformOptions),
  channelName: requiredText("Channel name", 120),
  channelUrl: optionalUrl,
  channelDescription: z
    .string()
    .trim()
    .min(10, "Please describe the channel in at least 10 characters")
    .max(1500, "Channel description must be 1500 characters or less"),
  niche: requiredText("Niche / category", 100),
  audienceSize: optionalText("Audience size", 60),
  contentStyle: optionalText("Content style", 100),
  apiKey: z
    .string()
    .trim()
    .min(1, "Google AI Studio API key is required")
    .max(256, "API key must be 256 characters or less"),
});

export type AnalyzeChannelInput = z.infer<typeof analyzeChannelSchema>;

export const strategyPhaseSchema = z.object({
  title: responseText(120),
  duration: responseText(60),
  actions: z.array(responseText(240)).min(1).max(6),
  goals: z.array(responseText(180)).min(1).max(4),
});

export const analysisResultSchema = z.object({
  channelAnalysis: z.object({
    overview: responseText(1000),
    strengths: z.array(responseText(180)).min(1).max(6),
    audienceProfile: responseText(1000),
    contentThemes: z.array(responseText(120)).min(1).max(8),
    engagementInsights: responseText(1000),
  }),
  productSuggestions: z.array(
    z.object({
      name: responseText(120),
      type: responseText(120),
      description: responseText(800),
      targetAudience: responseText(300),
      estimatedPriceRange: responseText(60),
      whyItWorks: responseText(500),
      difficulty: z.enum(["Easy", "Medium", "Hard"]),
    })
  ).min(1).max(4),
  strategyPlan: z.object({
    phase1: strategyPhaseSchema,
    phase2: strategyPhaseSchema,
    phase3: strategyPhaseSchema,
    keyMetrics: z.array(responseText(120)).min(1).max(8),
    risks: z.array(responseText(180)).min(1).max(5),
    timeline: responseText(120),
  }),
});

export interface ChannelAnalysis {
  overview: string;
  strengths: string[];
  audienceProfile: string;
  contentThemes: string[];
  engagementInsights: string;
}

export interface ProductSuggestion {
  name: string;
  type: string;
  description: string;
  targetAudience: string;
  estimatedPriceRange: string;
  whyItWorks: string;
  difficulty: "Easy" | "Medium" | "Hard";
}

export interface StrategyPlan {
  phase1: StrategyPhase;
  phase2: StrategyPhase;
  phase3: StrategyPhase;
  keyMetrics: string[];
  risks: string[];
  timeline: string;
}

export interface StrategyPhase {
  title: string;
  duration: string;
  actions: string[];
  goals: string[];
}

export interface AnalysisResult {
  channelAnalysis: ChannelAnalysis;
  productSuggestions: ProductSuggestion[];
  strategyPlan: StrategyPlan;
}
