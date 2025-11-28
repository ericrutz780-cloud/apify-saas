import { GoogleGenAI, Type } from "@google/genai";
import { Ad, Platform } from "../types";

// Helper to generate random consistent images based on ID
const getPlaceholderImage = (id: string, width: number, height: number) => 
  `https://picsum.photos/seed/${id}/${width}/${height}`;

export const searchAdsWithGemini = async (
  keyword: string, 
  platform: Platform, 
  limit: number
): Promise<Ad[]> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.warn("No API Key found. Returning fallback static data.");
      return generateFallbackData(keyword, platform, limit);
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
      Generate ${limit} realistic ${platform} ad examples for the keyword "${keyword}".
      
      For META ads, focus on direct response marketing, clear headlines, and "Shop Now" or "Learn More" CTAs.
      For TIKTOK ads, focus on viral trends, user-generated content style captions, and engagement metrics.

      Return a JSON array where each object has:
      - advertiserName: string
      - advertiserHandle: string (starts with @)
      - headline: string (catchy hook)
      - primaryText: string (ad body copy)
      - ctaText: string (e.g., Shop Now, Learn More, Install App)
      - format: "IMAGE" or "VIDEO"
      - likes: number (realistic engagement)
      - shares: number
      - views: number
      - impressions: number (high numbers)
      - spend: number (estimated USD)
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              advertiserName: { type: Type.STRING },
              advertiserHandle: { type: Type.STRING },
              headline: { type: Type.STRING },
              primaryText: { type: Type.STRING },
              ctaText: { type: Type.STRING },
              format: { type: Type.STRING, enum: ["IMAGE", "VIDEO"] },
              likes: { type: Type.NUMBER },
              shares: { type: Type.NUMBER },
              views: { type: Type.NUMBER },
              impressions: { type: Type.NUMBER },
              spend: { type: Type.NUMBER },
            },
            required: ["advertiserName", "headline", "primaryText", "likes"],
          },
        },
      },
    });

    const rawData = JSON.parse(response.text || "[]");

    return rawData.map((item: any, index: number) => {
      const id = `${platform.toLowerCase()}-${Date.now()}-${index}`;
      return {
        id,
        platform,
        advertiserName: item.advertiserName,
        advertiserHandle: item.advertiserHandle,
        headline: item.headline,
        primaryText: item.primaryText,
        ctaText: item.ctaText,
        format: item.format,
        imageUrl: getPlaceholderImage(id, platform === 'META' ? 600 : 400, platform === 'META' ? 315 : 700), // Landscape for Meta, Portrait for TikTok
        likes: item.likes,
        shares: item.shares,
        views: item.views,
        impressions: item.impressions,
        spend: item.spend,
        timestamp: new Date(Date.now() - Math.floor(Math.random() * 1000000000)).toISOString(),
      };
    });

  } catch (error) {
    console.error("Gemini API Error", error);
    return generateFallbackData(keyword, platform, limit);
  }
};

const generateFallbackData = (keyword: string, platform: Platform, limit: number): Ad[] => {
  return Array.from({ length: limit }).map((_, i) => {
    const id = `mock-${i}`;
    return {
      id,
      platform,
      advertiserName: `${keyword} Brand ${i + 1}`,
      advertiserHandle: `@${keyword.replace(/\s/g, '')}_${i}`,
      headline: `Best ${keyword} Solution 2024`,
      primaryText: `This is a simulated ad body for ${keyword}. The Gemini API key was missing or failed.`,
      ctaText: "Shop Now",
      format: Math.random() > 0.5 ? 'VIDEO' : 'IMAGE',
      imageUrl: getPlaceholderImage(id, 600, 400),
      likes: Math.floor(Math.random() * 5000),
      shares: Math.floor(Math.random() * 500),
      views: Math.floor(Math.random() * 100000),
      impressions: Math.floor(Math.random() * 500000),
      spend: Math.floor(Math.random() * 2000),
      timestamp: new Date().toISOString(),
    };
  });
};
