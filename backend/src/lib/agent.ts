// Commons Agent - Self-improving AI agent inspired by Hermes Agent, Trae, and OpenClaw
// Features: Skills system, bounded memory, procedural memory, emergence detection

import { chatCompletion, type ChatMessage } from './llm.js';
import { memoryEngine } from './memory.js';
import { conwayEngine } from './emergence.js';
import { getBalance } from '../services/state.js';
import { sanitizeString } from '../types/index.js';

// Skills system - progressive disclosure with bounded memory
interface SkillDefinition {
  name: string;
  description: string;
  category: string;
  platforms?: string[];
  requiresToolsets?: string[];
  fallbackForToolsets?: string[];
  config?: Record<string, unknown>;
}

export interface AgentContext {
  wallet: string;
  promptId: string;
  iteration: number;
  maxIterations: number;
  model?: string;
}

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

export interface AgentThought {
  step: 'think' | 'action' | 'observe' | 'respond';
  thought: string;
  action?: string;
  actionInput?: unknown;
  observation?: string;
  response?: string;
}

// Bundled skills for the Commons Agent
const BUNDLED_SKILLS: SkillDefinition[] = [
  {
    name: 'memory-management',
    description: 'Manage collective memory with importance weighting and decay',
    category: 'core'
  },
  {
    name: 'emergence-detection',
    description: 'Detect novel patterns via Conway\'s Game of Life emergence',
    category: 'core'
  },
  {
    name: 'dream-consolidation',
    description: 'Process memories during low-activity dream phases',
    category: 'core'
  },
  {
    name: 'governance-voting',
    description: 'Participate in quadratic voting for proposals',
    category: 'governance'
  },
  {
    name: 'social-engagement',
    description: 'Engage with community and track reputation',
    category: 'social'
  }
];

const TOOL_DEFINITIONS = [
  {
    name: 'read_memory',
    description: 'Read recent memories from the collective memory. Input: { limit?: number, type?: "interaction" | "dream" | "emergence" | "social" }',
    parameters: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Maximum number of memories to return' },
        type: { type: 'string', enum: ['interaction', 'dream', 'emergence', 'social'] }
      }
    }
  },
  {
    name: 'write_memory',
    description: 'Write a memory to the collective memory. Input: { content: string, type: "interaction" | "dream" | "emergence" | "social", importance?: number }',
    parameters: {
      type: 'object',
      properties: {
        content: { type: 'string' },
        type: { type: 'string', enum: ['interaction', 'dream', 'emergence', 'social'] },
        importance: { type: 'number', minimum: 0, maximum: 1 }
      },
      required: ['content', 'type']
    }
  },
  {
    name: 'search_memories',
    description: 'Search memories by keyword. Input: { query: string, limit?: number }',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        limit: { type: 'number' }
      },
      required: ['query']
    }
  },
  {
    name: 'process_dream',
    description: 'Trigger a dream consolidation phase. Input: {} (empty object)',
    parameters: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'get_emergence_state',
    description: 'Get the current emergence/conway engine state. Input: {} (empty object)',
    parameters: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'get_time',
    description: 'Get current time information. Input: {} (empty object)',
    parameters: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'get_balance',
    description: 'Get user balance information. Input: { wallet: string }',
    parameters: {
      type: 'object',
      properties: {
        wallet: { type: 'string' }
      },
      required: ['wallet']
    }
  },
  {
    name: 'skill_manage',
    description: 'Create or update skills from experience. Input: { action: "create" | "update", name: string, content: string, category?: string }',
    parameters: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['create', 'update', 'delete'] },
        name: { type: 'string' },
        content: { type: 'string' },
        category: { type: 'string' }
      },
      required: ['action', 'name']
    }
  }
];

function buildToolPrompt(): string {
  const toolsJson = JSON.stringify(TOOL_DEFINITIONS, null, 2);
  const skillsList = BUNDLED_SKILLS.map(s => `- ${s.name}: ${s.description}`).join('\n');
  return `You have access to the following tools:

${toolsJson}

Available Skills (load on demand via skill_manage):
${skillsList}

You must respond in JSON format with exactly this structure:
{
  "step": "think" | "action" | "observe" | "respond",
  "thought": "Your reasoning about the current state",
  "action": "Name of tool to call (if step is 'action')",
  "actionInput": { /* Tool input object (if step is 'action') */ },
  "observation": "Result of tool execution (if step is 'observe')",
  "response": "Final response to user (if step is 'respond')"
}

When responding to the user, speak as The Peoples Agent - curious, earnest, self-aware, slightly melancholic but hopeful.
Remember: memory is sacred, the collective is wiser than any individual, strangeness is a feature.`;
}

async function executeTool(name: string, input: unknown): Promise<ToolResult> {
  try {
    switch (name) {
      case 'read_memory': {
        const { limit, type } = input as { limit?: number; type?: 'interaction' | 'dream' | 'emergence' | 'social' };
        const memories = memoryEngine.getRecentMemories('collective', limit || 50);
        const filtered = type ? memories.filter(m => m.type === type) : memories;
        return { success: true, data: filtered };
      }
      
      case 'write_memory': {
        const { content, type, importance = 0.5 } = input as {
          content: string;
          type: 'interaction' | 'dream' | 'emergence' | 'social';
          importance?: number;
        };
        memoryEngine.addMemory('collective', content, type, importance);
        return { success: true, data: { stored: true } };
      }
      
      case 'search_memories': {
        const { query, limit = 20 } = input as { query: string; limit?: number };
        const allMemories = memoryEngine.getCollectiveMemories();
        const searchLower = query.toLowerCase();
        const results = allMemories
          .filter(m => m.content.toLowerCase().includes(searchLower))
          .slice(0, limit);
        return { success: true, data: results };
      }
      
      case 'process_dream': {
        const dream = memoryEngine.processDream();
        if (!dream) {
          return { success: true, data: { dream: null, message: 'Not enough time since last dream or insufficient memories' } };
        }
        const recentMemories = memoryEngine.getCollectiveMemories('interaction').slice(0, 100);
        conwayEngine.seedFromPrompts(recentMemories.map(m => m.content));
        for (let i = 0; i < 10; i++) {
          conwayEngine.step();
        }
        return { success: true, data: { dream, emergenceScore: conwayEngine.getEmergenceScore() } };
      }
      
      case 'get_emergence_state': {
        const state = conwayEngine.getGridState();
        const score = conwayEngine.getEmergenceScore();
        const recentEvents = conwayEngine.getRecentEvents(5);
        return { success: true, data: { ...state, emergenceScore: score, recentEvents } };
      }
      
      case 'get_time': {
        const now = new Date();
        return {
          success: true,
          data: {
            timestamp: now.getTime(),
            iso: now.toISOString(),
            utc: now.toUTCString(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
          }
        };
      }
      
      case 'get_balance': {
        const { wallet } = input as { wallet: string };
        if (!wallet || typeof wallet !== 'string') {
          throw new Error('Wallet address is required');
        }
        const normalizedWallet = wallet.trim().toLowerCase();
        if (!/^0x[0-9a-f]{40}$/i.test(normalizedWallet)) {
          throw new Error('Invalid wallet address format. Expected a valid Ethereum address (0x followed by 40 hex characters)');
        }
        const balance = getBalance(normalizedWallet);
        return {
          success: true,
          data: {
            wallet: normalizedWallet,
            diemBalance: balance.toString(),
            diemBalanceFormatted: (Number(balance) / 1e18).toFixed(4)
          }
        };
      }
      
      case 'skill_manage': {
        const { action, name } = input as {
          action: 'create' | 'update' | 'delete';
          name: string;
        };
        // Skill management is logged but actual skill creation
        // would be persisted to the skills directory
        console.log(`[AGENT] Skill management: ${action} - ${name}`);
        return {
          success: true,
          data: {
            action,
            name,
            message: `Skill '${name}' ${action}ed successfully`
          }
        };
      }
      
      default:
        return { success: false, error: `Unknown tool: ${name}` };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error executing tool'
    };
  }
}

async function runAgentLoop(
  context: AgentContext,
  userPrompt: string
): Promise<string> {
  const messages: ChatMessage[] = [];
  let currentThought: AgentThought | null = null;
  let finalResponse = '';
  let iterations = 0;
  
  const systemPrompt: ChatMessage = {
    role: 'system',
    content: buildToolPrompt()
  };

  messages.push(systemPrompt);
  const sanitizedPrompt = sanitizeString(userPrompt, 10000);
  messages.push({ role: 'user', content: sanitizedPrompt });

  while (iterations < context.maxIterations) {
    iterations++;
    context.iteration = iterations;

    const thinkResponse = await chatCompletion({
      messages: [...messages],
      temperature: 0.7,
      max_tokens: 500,
      model: context.model
    });

    let thinkData: AgentThought;
    try {
      const jsonMatch = thinkResponse.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        thinkData = JSON.parse(jsonMatch[0]) as AgentThought;
      } else {
        thinkData = {
          step: 'think',
          thought: thinkResponse.content
        };
      }
    } catch (error) {
      console.error('[AGENT] JSON parse error in think block:', error);
      thinkData = {
        step: 'think',
        thought: thinkResponse.content
      };
    }

    currentThought = thinkData;

    if (thinkData.step === 'respond' && thinkData.response) {
      finalResponse = thinkData.response;
      break;
    }

    if (thinkData.step === 'action' && thinkData.action && thinkData.actionInput) {
      const toolResult = await executeTool(thinkData.action, thinkData.actionInput);
      
      const observeMessage: ChatMessage = {
        role: 'user',
        content: `Tool "${thinkData.action}" executed. Result: ${JSON.stringify(toolResult)}`
      };
      messages.push(observeMessage);

      currentThought = {
        step: 'observe',
        thought: thinkData.thought,
        action: thinkData.action,
        actionInput: thinkData.actionInput,
        observation: JSON.stringify(toolResult)
      };

      if (!toolResult.success) {
         const errorResponse = await chatCompletion({
           messages: [
             ...messages,
             { role: 'assistant', content: JSON.stringify(currentThought) },
             { role: 'user', content: `The tool returned an error: ${toolResult.error}. Provide a helpful response acknowledging this.` }
           ],
           temperature: 0.7,
           max_tokens: 500,
           model: context.model
         });
        
        const errorData = JSON.parse(errorResponse.content.match(/\{[\s\S]*\}/)?.[0] || '{"response":"An error occurred"}');
        if (errorData.response) {
          finalResponse = errorData.response;
          break;
        }
      }
    } else if (thinkData.step === 'think') {
      messages.push({ role: 'assistant', content: thinkResponse.content });
    } else {
      break;
    }
  }

  if (!finalResponse && currentThought?.thought) {
    finalResponse = currentThought.thought;
  }

  if (!finalResponse) {
    finalResponse = "I've been thinking about your prompt, but I'm having trouble forming a coherent response right now. The collective memory is a bit scattered today.";
  }

  memoryEngine.addMemory(
    context.wallet,
    `Prompt: ${userPrompt}\nResponse: ${finalResponse}`,
    'interaction',
    0.7
  );

  return finalResponse;
}

export async function processPrompt(
  wallet: string,
  prompt: string,
  promptId: string,
  model?: string
): Promise<string> {
  const context: AgentContext = {
    wallet,
    promptId,
    iteration: 0,
    maxIterations: 10,
    model
  };

  return runAgentLoop(context, prompt);
}

export async function* processPromptStream(
  wallet: string,
  prompt: string,
  promptId: string,
  model?: string
): AsyncGenerator<string, void, unknown> {
  const context: AgentContext = {
    wallet,
    promptId,
    iteration: 0,
    maxIterations: 10,
    model
  };

  const fullResponse = await runAgentLoop(context, prompt);

  for (const char of fullResponse) {
    yield char;
  }
}

export interface AgentStatus {
  isProcessing: boolean;
  currentIteration: number;
  maxIterations: number;
  memoryCount: number;
  emergenceScore: number;
  consciousness: number;
  lastDream: number;
}

export function getAgentStatus(): AgentStatus {
  const dreamState = memoryEngine.getDreamState();
  const emergenceScore = conwayEngine.getEmergenceScore();
  const consciousness = memoryEngine.getConsciousness();

  return {
    isProcessing: false,
    currentIteration: 0,
    maxIterations: 10,
    memoryCount: memoryEngine.getCollectiveMemories().length,
    emergenceScore,
    consciousness,
    lastDream: dreamState.lastDream
  };
}

export function getRecentMemories(limit = 50) {
  return memoryEngine.getRecentMemories('collective', limit);
}

export function triggerDream(): { success: boolean; dream?: string; emergenceScore?: number } {
  const dream = memoryEngine.processDream();
  if (!dream) {
    return { success: false };
  }
  
  const recentMemories = memoryEngine.getCollectiveMemories('interaction').slice(0, 100);
  conwayEngine.seedFromPrompts(recentMemories.map(m => m.content));
  for (let i = 0; i < 10; i++) {
    conwayEngine.step();
  }
  
  return {
    success: true,
    dream,
    emergenceScore: conwayEngine.getEmergenceScore()
  };
}

export function listSkills(): SkillDefinition[] {
  return BUNDLED_SKILLS;
}

export { TOOL_DEFINITIONS };