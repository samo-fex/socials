import { storage } from "./storage";
import { db } from "./db";
import { aiConfigs, channels, videos } from "@shared/schema";

export async function seed() {
  const existingChannels = await storage.getChannels();
  if (existingChannels.length > 0) return;

  const existingConfigs = await storage.getAiConfigs();
  if (existingConfigs.length === 0) {
    await storage.createAiConfig({
      provider: "google",
      apiKey: "",
      model: "gemini-2.0-flash",
      temperature: 0.7,
      isActive: true,
    });
  }

  const channel1 = await storage.createChannel({
    name: "TechPulse",
    niche: "Technology Reviews",
    description: "In-depth reviews and analysis of the latest tech products, software, and AI tools. Helping you make informed decisions about technology.",
    keywords: ["tech reviews", "AI tools", "software reviews", "gadget reviews", "technology"],
    strategy: "",
    youtubeChannelId: "",
    subscriberCount: 0,
    videoCount: 3,
    viewCount: 0,
  });

  const channel2 = await storage.createChannel({
    name: "CodeCraft Academy",
    niche: "Programming Tutorials",
    description: "Learn modern web development, AI, and software engineering through practical, project-based tutorials.",
    keywords: ["programming", "web development", "javascript", "python", "tutorials", "coding"],
    strategy: "",
    youtubeChannelId: "",
    subscriberCount: 0,
    videoCount: 2,
    viewCount: 0,
  });

  await storage.createVideo({
    channelId: channel1.id,
    title: "Top 10 AI Tools That Will Change Your Workflow in 2025",
    description: "A comprehensive look at the most impactful AI tools for productivity, creativity, and automation.",
    keywords: ["AI tools", "productivity", "automation", "2025"],
    tags: ["ai", "tools", "productivity", "workflow", "automation"],
    script: "",
    status: "draft",
    notes: "Include demos of each tool. Focus on practical use cases.",
    strategy: "",
    thumbnailIdea: "Split screen showing before/after AI workflow with bold text overlay",
    targetAudience: "Tech professionals and early adopters",
    estimatedLength: "12-15 minutes",
  });

  await storage.createVideo({
    channelId: channel1.id,
    title: "Is the M4 MacBook Pro Worth It? Honest Review After 30 Days",
    description: "After using the M4 MacBook Pro for a full month, here is my unfiltered review covering performance, battery life, and real-world usage.",
    keywords: ["MacBook Pro", "M4", "Apple", "laptop review"],
    tags: ["macbook", "apple", "m4", "review", "laptop"],
    script: "",
    status: "planned",
    notes: "Compare with M3 model. Include benchmark results.",
    strategy: "",
    thumbnailIdea: "MacBook Pro on desk with rating score overlay",
    targetAudience: "Creative professionals considering an upgrade",
    estimatedLength: "15-18 minutes",
  });

  await storage.createVideo({
    channelId: channel1.id,
    title: "Building a Home Lab: Complete Beginner Guide",
    description: "Everything you need to know to set up your first home lab for learning networking, servers, and cloud technologies.",
    keywords: ["home lab", "networking", "servers", "beginner guide"],
    tags: ["homelab", "networking", "server", "beginner", "IT"],
    script: "",
    status: "draft",
    notes: "Budget-friendly options. Include parts list in description.",
    strategy: "",
    thumbnailIdea: "Clean desk setup with small server rack and cable management",
    targetAudience: "IT beginners and hobbyists",
    estimatedLength: "20-25 minutes",
  });

  await storage.createVideo({
    channelId: channel2.id,
    title: "Build a Full-Stack App with React and Node.js in 1 Hour",
    description: "Follow along as we build a complete task management app from scratch using React, Node.js, and PostgreSQL.",
    keywords: ["React", "Node.js", "full-stack", "tutorial"],
    tags: ["react", "nodejs", "fullstack", "tutorial", "javascript"],
    script: "",
    status: "draft",
    notes: "Use modern tooling: Vite, TypeScript, Drizzle ORM",
    strategy: "",
    thumbnailIdea: "Code editor screenshot with React and Node logos",
    targetAudience: "Junior to mid-level developers",
    estimatedLength: "60 minutes",
  });

  await storage.createVideo({
    channelId: channel2.id,
    title: "Python for Data Science: Complete Crash Course",
    description: "Learn Python fundamentals for data science including pandas, numpy, and matplotlib in this comprehensive tutorial.",
    keywords: ["Python", "data science", "pandas", "tutorial"],
    tags: ["python", "data-science", "pandas", "numpy", "tutorial"],
    script: "",
    status: "planned",
    notes: "Include downloadable Jupyter notebooks",
    strategy: "",
    thumbnailIdea: "Python logo with data visualization graphics",
    targetAudience: "Aspiring data scientists",
    estimatedLength: "45 minutes",
  });

  console.log("Seed data created successfully");
}
