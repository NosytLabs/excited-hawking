import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { API_BASE_URL, DEFAULT_MODEL, MAX_TOKEN_LIMIT } from "./constants.js";
import { ResponseFormat } from "./types.js";

const API_KEY = process.env.VENICE_API_KEY;

if (!API_KEY) {
  console.error("ERROR: VENICE_API_KEY environment variable is required");
  process.exit(1);
}

class VeniceAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = "VeniceAPIError";
  }
}

async function veniceRequest<T>(
  endpoint: string,
  method: "GET" | "POST" = "POST",
  body?: unknown,
  timeoutMs: number = 30000
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "Unknown error");
      throw new VeniceAPIError(
        `Venice API error: ${response.status} ${response.statusText} - ${errorBody}`,
        response.status,
        response.status >= 500 || response.status === 429
      );
    }

    return response.json() as Promise<T>;
  } catch (err) {
    clearTimeout(timeout);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new VeniceAPIError("Request timed out", 408, true);
    }
    throw err;
  }
}

function handleApiError(error: unknown): string {
  if (error instanceof VeniceAPIError) {
    if (error.statusCode === 401) {
      return "Error: Invalid API key. Please check your VENICE_API_KEY.";
    }
    if (error.statusCode === 429) {
      return "Error: Rate limit exceeded. Please wait before making more requests.";
    }
    if (error.statusCode === 400) {
      return `Error: Bad request - ${error.message}`;
    }
    return `Error: ${error.message}`;
  }
  return `Error: Unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`;
}

const server = new McpServer({
  name: "venice-mcp-server",
  version: "1.0.0"
});

const VeniceChatInputSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(["system", "user", "assistant"]),
    content: z.string().max(MAX_TOKEN_LIMIT).describe("Message content")
  })).max(100, "Maximum 100 messages").describe("Array of chat messages with roles (system, user, assistant)"),
  model: z.string().optional().default(DEFAULT_MODEL).describe("Model ID to use for completion"),
  temperature: z.number().min(0).max(2).optional().default(0.7).describe("Temperature for generation (0-2)"),
  max_tokens: z.number().min(1).max(MAX_TOKEN_LIMIT).optional().default(2048).describe("Maximum tokens to generate"),
  response_format: z.nativeEnum(ResponseFormat).optional().default(ResponseFormat.MARKDOWN).describe("Output format")
}).strict();

type VeniceChatInput = z.infer<typeof VeniceChatInputSchema>;

server.registerTool(
  "venice_chat",
  {
    title: "Venice Chat Completion",
    description: `Send a chat completion request to Venice AI using their 230+ available models.

This tool provides access to Venice AI's chat completion endpoint with support for many models including Llama, Mistral, Qwen, and more. The system prompt from The Peoples Agent is automatically included.

Args:
  - messages (array): Chat messages [{role: "system"|"user"|"assistant", content: string}]
  - model (string): Model ID (default: llama-3.1-sonar-huge-128k-online)
  - temperature (number): Sampling temperature 0-2 (default: 0.7)
  - max_tokens (number): Maximum tokens to generate (default: 2048)
  - response_format ('markdown' | 'json'): Output format (default: markdown)

Returns:
  For JSON format: { content: string, usage?: {...}, model: string }
  For markdown: Formatted response text

Error Handling:
  - Returns error message if API key is invalid (401)
  - Returns error if rate limited (429)
  - Returns error if request fails (400)`,
    inputSchema: VeniceChatInputSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  async (params: VeniceChatInput) => {
    try {
      const body = {
        model: params.model || DEFAULT_MODEL,
        messages: params.messages,
        temperature: params.temperature ?? 0.7,
        max_tokens: params.max_tokens ?? 2048
      };

      const response = await veniceRequest<{
        choices: Array<{ message: { content: string } }>;
        usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
        model: string;
      }>("/chat/completions", "POST", body);

      const content = response.choices[0]?.message?.content || "";
      const output = {
        content,
        usage: response.usage,
        model: response.model || params.model || DEFAULT_MODEL
      };

      if (params.response_format === ResponseFormat.JSON) {
        return {
          content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
          structuredContent: output
        };
      }

      const usageInfo = output.usage 
        ? `\n\n---\n**Usage**: ${output.usage.prompt_tokens} prompt + ${output.usage.completion_tokens} completion = ${output.usage.total_tokens} total tokens`
        : "";

      return {
        content: [{ type: "text", text: content + usageInfo }],
        structuredContent: output
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: handleApiError(error) }]
      };
    }
  }
);

const VeniceGenerateImageInputSchema = z.object({
  prompt: z.string().min(1).max(4000).describe("Image generation prompt"),
  model: z.string().optional().default("flux-3").describe("Image generation model"),
  width: z.number().int().min(256).max(2048).optional().default(1024).describe("Image width"),
  height: z.number().int().min(256).max(2048).optional().default(1024).describe("Image height"),
  steps: z.number().int().min(1).max(50).optional().default(25).describe("Generation steps"),
  seed: z.number().int().min(0).max(4294967295).optional().describe("Random seed"),
  negative_prompt: z.string().max(4000).optional().describe("Negative prompt"),
  response_format: z.nativeEnum(ResponseFormat).optional().default(ResponseFormat.MARKDOWN).describe("Output format")
}).strict();

type VeniceGenerateImageInput = z.infer<typeof VeniceGenerateImageInputSchema>;

server.registerTool(
  "venice_generate_image",
  {
    title: "Venice Image Generation",
    description: `Generate images using Venice AI's image generation models (Flux, etc.).

Args:
  - prompt (string): Text description of the image to generate (required, max 4000 chars)
  - model (string): Image model (default: flux-3)
  - width (number): Output width 256-2048 (default: 1024)
  - height (number): Output height 256-2048 (default: 1024)
  - steps (number): Generation steps 1-50 (default: 25)
  - seed (number): Random seed for reproducibility
  - negative_prompt (string): Things to avoid in the image
  - response_format ('markdown' | 'json'): Output format (default: markdown)

Returns:
  For JSON format: { images: [{url: string, base64?: string}], seed: number }
  For markdown: Image URL with generation details

Error Handling:
  - Returns error if prompt is empty or too long
  - Returns error if model not available`,
    inputSchema: VeniceGenerateImageInputSchema,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true
    }
  },
  async (params: VeniceGenerateImageInput) => {
    try {
      const body: Record<string, unknown> = {
        prompt: params.prompt,
        model: params.model || "flux-3",
        width: params.width || 1024,
        height: params.height || 1024,
        steps: params.steps || 25
      };

      if (params.seed !== undefined) {
        body.seed = params.seed;
      }
      if (params.negative_prompt) {
        body.negative_prompt = params.negative_prompt;
      }

      const response = await veniceRequest<{
        images?: Array<{url?: string; base64?: string}>;
        seed?: number;
        data?: Array<{url?: string; base64?: string}>;
      }>("/images/generations", "POST", body);

      const images = response.images || response.data || [];
      const firstImage = images[0];
      const imageUrl = firstImage?.url || (firstImage?.base64 ? "[base64 image omitted]" : "No image returned");

      const output = {
        images: images.map(img => ({ url: img.url, base64: img.base64 ? "[base64 data]" : undefined })),
        seed: response.seed
      };

      if (params.response_format === ResponseFormat.JSON) {
        return {
          content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
          structuredContent: output
        };
      }

      let text = `# Image Generated\n\n`;
      text += `**Prompt**: ${params.prompt}\n`;
      text += `**Model**: ${body.model}\n`;
      text += `**Size**: ${body.width}x${body.height}\n`;
      if (response.seed !== undefined) text += `**Seed**: ${response.seed}\n`;
      text += `\n${imageUrl}\n`;

      return {
        content: [{ type: "text", text }],
        structuredContent: output
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: handleApiError(error) }]
      };
    }
  }
);

const VeniceWebSearchInputSchema = z.object({
  query: z.string().min(1).max(1000).describe("Web search query"),
  limit: z.number().int().min(1).max(100).optional().default(10).describe("Number of results"),
  recency_days: z.number().int().min(1).max(365).optional().describe("Limit to results from last N days"),
  response_format: z.nativeEnum(ResponseFormat).optional().default(ResponseFormat.MARKDOWN).describe("Output format")
}).strict();

type VeniceWebSearchInput = z.infer<typeof VeniceWebSearchInputSchema>;

server.registerTool(
  "venice_web_search",
  {
    title: "Venice Web Search",
    description: `Search the web using Venice AI's search capabilities.

Args:
  - query (string): Search query (required, max 1000 chars)
  - limit (number): Number of results 1-100 (default: 10)
  - recency_days (number): Limit to results from last N days
  - response_format ('markdown' | 'json'): Output format (default: markdown)

Returns:
  For JSON format: { results: [{title, url, snippet, date}], count: number }
  For markdown: Formatted search results with titles, URLs, and snippets`,
    inputSchema: VeniceWebSearchInputSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  async (params: VeniceWebSearchInput) => {
    try {
      const body: Record<string, unknown> = {
        query: params.query,
        limit: params.limit || 10
      };

      if (params.recency_days) {
        body.recency_days = params.recency_days;
      }

      const response = await veniceRequest<{
        results?: Array<{
          title?: string;
          url?: string;
          snippet?: string;
          date?: string;
          description?: string;
        }>;
        data?: Array<{
          title?: string;
          url?: string;
          snippet?: string;
          date?: string;
          description?: string;
        }>;
        count?: number;
      }>("/search/online", "POST", body);

      const results = (response.results || response.data || []) as Array<{
        title?: string;
        url?: string;
        snippet?: string;
        date?: string;
        description?: string;
      }>;
      const output = {
        results: results.map(r => ({
          title: r.title || "Untitled",
          url: r.url || "",
          snippet: r.snippet || r.description || "",
          date: r.date,
          description: r.description
        })),
        count: response.count || results.length
      };

      if (params.response_format === ResponseFormat.JSON) {
        return {
          content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
          structuredContent: output
        };
      }

      let text = `# Web Search: "${params.query}"\n\n`;
      text += `Found ${results.length} results\n\n`;

      for (const result of results) {
        text += `## ${result.title || "Untitled"}\n`;
        text += `URL: ${result.url || "No URL"}\n`;
        if (result.snippet) text += `\n${result.snippet}\n`;
        if (result.date) text += `\n*Date: ${result.date}*\n`;
        text += "\n---\n\n";
      }

      return {
        content: [{ type: "text", text }],
        structuredContent: output
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: handleApiError(error) }]
      };
    }
  }
);

const VeniceEmbeddingsInputSchema = z.object({
  input: z.union([z.string().max(8000), z.array(z.string().max(8000)).max(500)]).describe("Text or array of texts to embed (max 8000 chars each, max 500 items)"),
  model: z.string().optional().default("embedding").describe("Embedding model"),
  response_format: z.nativeEnum(ResponseFormat).optional().default(ResponseFormat.JSON).describe("Output format")
}).strict();

type VeniceEmbeddingsInput = z.infer<typeof VeniceEmbeddingsInputSchema>;

server.registerTool(
  "venice_embeddings",
  {
    title: "Venice Embeddings",
    description: `Generate embeddings for text using Venice AI's embedding models.

Args:
  - input (string | array): Text or array of texts to embed
  - model (string): Embedding model (default: embedding)
  - response_format ('markdown' | 'json'): Output format (default: json)

Returns:
  For JSON format: { embeddings: [{object, embedding: number[], index}], model: string, usage?: {...} }
  For markdown: Formatted embedding results with dimensions`,
    inputSchema: VeniceEmbeddingsInputSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  async (params: VeniceEmbeddingsInput) => {
    try {
      const body = {
        input: params.input,
        model: params.model || "embedding"
      };

      const response = await veniceRequest<{
        data?: Array<{
          object?: string;
          embedding?: number[];
          index?: number;
        }>;
        model?: string;
        usage?: {
          prompt_tokens: number;
          total_tokens: number;
        };
      }>("/embeddings", "POST", body);

      const embeddings = response.data || [];
      const output = {
        embeddings: embeddings.map(e => ({
          object: e.object || "embedding",
          embedding: e.embedding || [],
          index: e.index ?? 0,
          dimensions: e.embedding?.length || 0
        })),
        model: response.model || body.model,
        usage: response.usage
      };

      if (params.response_format === ResponseFormat.JSON) {
        return {
          content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
          structuredContent: output
        };
      }

      let text = `# Venice Embeddings\n\n`;
      text += `**Model**: ${output.model}\n`;
      text += `**Count**: ${embeddings.length} embedding(s)\n\n`;

      for (let i = 0; i < embeddings.length; i++) {
        const emb = embeddings[i];
        const preview = emb.embedding?.slice(0, 5).join(", ");
        text += `## Embedding ${i + 1}\n`;
        text += `- Dimensions: ${emb.embedding?.length || 0}\n`;
        text += `- Preview: [${preview}${emb.embedding && emb.embedding.length > 5 ? ", ..." : ""}]\n\n`;
      }

      return {
        content: [{ type: "text", text }],
        structuredContent: output
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: handleApiError(error) }]
      };
    }
  }
);

const VeniceListModelsInputSchema = z.object({
  limit: z.number().int().min(1).max(500).optional().default(50).describe("Number of models to return"),
  offset: z.number().int().min(0).optional().default(0).describe("Offset for pagination"),
  response_format: z.nativeEnum(ResponseFormat).optional().default(ResponseFormat.MARKDOWN).describe("Output format")
}).strict();

type VeniceListModelsInput = z.infer<typeof VeniceListModelsInputSchema>;

server.registerTool(
  "venice_list_models",
  {
    title: "Venice List Models",
    description: `List all available models from Venice AI (230+ models).

Args:
  - limit (number): Maximum results 1-500 (default: 50)
  - offset (number): Pagination offset (default: 0)
  - response_format ('markdown' | 'json'): Output format (default: markdown)

Returns:
  For JSON format: { models: [{id, name, provider, context_length}], total: number, has_more: boolean }
  For markdown: Formatted list of available models with IDs and providers`,
    inputSchema: VeniceListModelsInputSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  async (params: VeniceListModelsInput) => {
    try {
      const response = await veniceRequest<{
        data?: Array<{
          id?: string;
          name?: string;
          provider?: string;
          context_length?: number;
          object?: string;
        }>;
        models?: Array<{
          id?: string;
          name?: string;
          provider?: string;
          context_length?: number;
        }>;
        total?: number;
      }>("/models", "GET");

      const models = response.data || response.models || [];
      const offset = params.offset || 0;
      const limit = params.limit || 50;
      const paginatedModels = models.slice(offset, offset + limit);
      const hasMore = models.length > offset + limit;

      const output = {
        models: paginatedModels.map(m => ({
          id: m.id || "unknown",
          name: m.name || m.id || "Unknown",
          provider: m.provider || "venice",
          context_length: m.context_length
        })),
        total: models.length,
        has_more: hasMore,
        next_offset: hasMore ? offset + limit : undefined
      };

      if (params.response_format === ResponseFormat.JSON) {
        return {
          content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
          structuredContent: output
        };
      }

      let text = `# Venice AI Models\n\n`;
      text += `Showing ${paginatedModels.length} of ${models.length} models\n`;
      text += `Use offset/limit for pagination\n\n`;

      for (const model of paginatedModels) {
        text += `## ${model.name}\n`;
        text += `- **ID**: \`${model.id}\`\n`;
        text += `- **Provider**: ${model.provider}\n`;
        if (model.context_length) text += `- **Context Length**: ${model.context_length.toLocaleString()} tokens\n`;
        text += "\n";
      }

      return {
        content: [{ type: "text", text }],
        structuredContent: output
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: handleApiError(error) }]
      };
    }
  }
);

const VeniceGetModelInputSchema = z.object({
  model_id: z.string().describe("Model ID to get information for"),
  response_format: z.nativeEnum(ResponseFormat).optional().default(ResponseFormat.MARKDOWN).describe("Output format")
}).strict();

type VeniceGetModelInput = z.infer<typeof VeniceGetModelInputSchema>;

server.registerTool(
  "venice_get_model",
  {
    title: "Venice Get Model Info",
    description: `Get detailed information about a specific Venice AI model.

Args:
  - model_id (string): The model identifier (e.g., "llama-3.1-sonar-huge-128k-online")
  - response_format ('markdown' | 'json'): Output format (default: markdown)

Returns:
  For JSON format: { id, name, provider, context_length, capabilities }
  For markdown: Detailed model information`,
    inputSchema: VeniceGetModelInputSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  async (params: VeniceGetModelInput) => {
    try {
      const response = await veniceRequest<{
        id?: string;
        name?: string;
        provider?: string;
        context_length?: number;
        object?: string;
      }>(`/models/${encodeURIComponent(params.model_id)}`, "GET");

      const output = {
        id: response.id || params.model_id,
        name: response.name || response.id || params.model_id,
        provider: response.provider || "venice",
        context_length: response.context_length
      };

      if (params.response_format === ResponseFormat.JSON) {
        return {
          content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
          structuredContent: output
        };
      }

      let text = `# Model: ${output.name}\n\n`;
      text += `- **ID**: \`${output.id}\`\n`;
      text += `- **Provider**: ${output.provider}\n`;
      if (output.context_length) {
        text += `- **Context Length**: ${output.context_length.toLocaleString()} tokens\n`;
      }

      return {
        content: [{ type: "text", text }],
        structuredContent: output
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: handleApiError(error) }]
      };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Venice MCP Server running via stdio");
}

main().catch(error => {
  console.error("Server error:", error);
  process.exit(1);
});
