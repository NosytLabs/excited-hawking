import { z } from "zod";

export enum ResponseFormat {
  MARKDOWN = "markdown",
  JSON = "json"
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  context_length?: number;
}

export interface EmbeddingData {
  object: string;
  embedding: number[];
  index: number;
}

export interface ImageGenerationOptions {
  model?: string;
  prompt: string;
  width?: number;
  height?: number;
  steps?: number;
  seed?: number;
  negative_prompt?: string;
}

export interface SearchOptions {
  query: string;
  limit?: number;
  offset?: number;
  recency_days?: number;
}