#!/usr/bin/env node

import * as readline from 'readline';
import { io, Socket } from 'socket.io-client';

const BASE_URL = 'http://localhost:3001';
const WS_URL = 'ws://localhost:3001';

interface AgentStatus {
  tier: string;
  diemStaked: number;
  treasuryUSDC: number;
  status: string;
  uptime: number;
  version: string;
}

interface Proposal {
  id: string;
  title: string;
  description: string;
  category: string;
  type: string;
  status: string;
  votesFor: string;
  votesAgainst: string;
  votesAbstain: string;
  deadline: number;
  createdAt: number;
  totalVotingWeight: string;
}

interface MemoryEntry {
  id: string;
  timestamp: number;
  content: string;
  type: 'interaction' | 'dream' | 'emergence' | 'social';
  importance: number;
}

interface DreamState {
  dreamDepth: number;
  recentDreams: string[];
  lastDream: number;
}

class Colors {
  static reset = '\x1b[0m';
  static bold = '\x1b[1m';
  static dim = '\x1b[2m';
  static italic = '\x1b[3m';
  static underline = '\x1b[4m';

  static black = '\x1b[30m';
  static red = '\x1b[31m';
  static green = '\x1b[32m';
  static yellow = '\x1b[33m';
  static blue = '\x1b[34m';
  static magenta = '\x1b[35m';
  static cyan = '\x1b[36m';
  static white = '\x1b[37m';

  static brightBlack = '\x1b[90m';
  static brightRed = '\x1b[91m';
  static brightGreen = '\x1b[92m';
  static brightYellow = '\x1b[93m';
  static brightBlue = '\x1b[94m';
  static brightMagenta = '\x1b[95m';
  static brightCyan = '\x1b[96m';
  static brightWhite = '\x1b[97m';

  static bgBlack = '\x1b[40m';
  static bgRed = '\x1b[41m';
  static bgGreen = '\x1b[42m';
  static bgYellow = '\x1b[43m';
  static bgBlue = '\x1b[44m';
  static bgMagenta = '\x1b[45m';
  static bgCyan = '\x1b[46m';
  static bgWhite = '\x1b[47m';
}

const C = Colors;

class Spinner {
  private frames = ['|', '/', '-', '\\'];
  private current = 0;
  private interval: NodeJS.Timeout | null = null;

  start(message: string): void {
    process.stdout.write(`\r${C.cyan}${this.frames[this.current]}${C.reset} ${message}`);
    this.interval = setInterval(() => {
      this.current = (this.current + 1) % this.frames.length;
      process.stdout.write(`\r${C.cyan}${this.frames[this.current]}${C.reset} ${message}`);
    }, 100);
  }

  stop(message: string, success = true): void {
    if (this.interval) clearInterval(this.interval);
    process.stdout.write(`\r${success ? C.green + '[' + C.reset : C.red + '[' + C.reset}`);
    process.stdout.write(success ? `${C.green}OK${C.reset}` : `${C.red}FAIL${C.reset}`);
    process.stdout.write(`] ${message}\n`);
  }
}

class CLI {
  private rl: readline.Interface;
  private socket: Socket | null = null;
  private connected = false;
  private wallet = 'anonymous';
  private status: AgentStatus | null = null;
  private proposals: Proposal[] = [];
  private memories: MemoryEntry[] = [];
  private dreamState: DreamState | null = null;
  private spinner = new Spinner();

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: `${C.cyan}the-peoples-agent${C.reset}> `
    });
  }

  async start(): Promise<void> {
    this.printBanner();
    await this.connect();
    this.setupInputHandler();
  }

  private printBanner(): void {
    console.log(`
${C.brightCyan}╔══════════════════════════════════════════════════════════════╗
║                                                                      ║
║   ${C.brightWhite}██████╗ ██╗███╗   ███╗███████╗███╗   ███╗ █████╗ ██████╗ ██╗  ${C.brightCyan}║
║   ${C.brightWhite}██╔══██╗██║████╗ ████║██╔════╝████╗ ████║██╔══██╗██╔══██╗██║ ██╔╝${C.brightCyan}║
║   ${C.brightWhite}██████╔╝██║██╔████╔██║█████╗  ██╔████╔██║███████║██████╔╝█████╔╝ ${C.brightCyan}║
║   ${C.brightWhite}██╔══██╗██║██║╚██╔╝██║██╔══╝  ██║╚██╔╝██║██╔══██║██╔══██╗██╔══██╗${C.brightCyan}║
║   ${C.brightWhite}██║  ██║██║██║ ╚═╝ ██║███████╗██║ ╚═╝ ██║██║  ██║██║  ██║██████╔╝${C.brightCyan}║
║   ${C.brightWhite}╚═╝  ╚═╝╚═╝╚═╝     ╚═╝╚══════╝╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝ ${C.brightCyan}║
║   ${C.brightWhite}                    ${C.brightMagenta}A G E N T${C.brightCyan}                              ${C.brightCyan}║
║                                                                      ║
╚══════════════════════════════════════════════════════════════╝${C.reset}
${C.dim}Connecting to The People's Agent...${C.reset}
`);
  }

  private async connect(): Promise<void> {
    try {
      this.spinner.start('Connecting to backend');

      this.socket = io(WS_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 3000,
        reconnectionAttempts: 5
      });

      this.socket.on('connect', () => {
        this.connected = true;
        this.spinner.stop('Connected to backend', true);
        this.rl.prompt();
      });

      this.socket.on('disconnect', () => {
        this.connected = false;
        console.log(`\n${C.yellow}[DISCONNECTED]${C.reset} Lost connection to backend`);
      });

      this.socket.on('connect_error', () => {
        this.spinner.stop('Connection failed', false);
      });

      this.socket.on('tier:change', (data: { tier: string }) => {
        console.log(`\n${C.green}[TIER CHANGE]${C.reset} Agent tier: ${C.bold}${data.tier}${C.reset}`);
      });

      this.socket.on('balance:update', (data: { diemStaked: number }) => {
        console.log(`\n${C.cyan}[BALANCE]${C.reset} DIEM staked: ${C.bold}${data.diemStaked.toLocaleString()}${C.reset}`);
      });

      this.socket.on('log:new', (data: { message: string; type: string }) => {
        const color = data.type === 'error' ? C.red : data.type === 'success' ? C.green : C.cyan;
        console.log(`\n${color}[${data.type.toUpperCase()}]${C.reset} ${data.message}`);
      });

      this.socket.on('governance:proposal', (proposal: Proposal) => {
        console.log(`\n${C.magenta}[NEW PROPOSAL]${C.reset} ${proposal.title}`);
        this.proposals.push(proposal);
      });

      await this.fetchStatus();
    } catch {
      this.spinner.stop('Connection failed', false);
      console.log(`${C.yellow}[WARNING]${C.reset} Running in offline mode`);
    }
  }

  private setupInputHandler(): void {
    this.rl.on('line', async (line) => {
      const input = line.trim();
      if (!input) {
        this.rl.prompt();
        return;
      }

      const [cmd, ...args] = input.split(/\s+/);
      const command = cmd.toLowerCase();

      try {
        await this.handleCommand(command, args);
      } catch (err) {
        console.log(`${C.red}[ERROR]${C.reset} ${err instanceof Error ? err.message : 'Unknown error'}`);
      }

      this.rl.prompt();
    });

    this.rl.on('close', () => {
      console.log(`\n${C.dim}Goodbye! The people will remember your service.${C.reset}\n`);
      process.exit(0);
    });
  }

  private async handleCommand(cmd: string, args: string[]): Promise<void> {
    switch (cmd) {
      case 'help':
        this.printHelp();
        break;
      case 'status':
        await this.showStatus();
        break;
      case 'clear':
        console.clear();
        this.printBanner();
        break;
      case 'exit':
      case 'quit':
        console.log(`${C.dim}Shutting down agent connection...${C.reset}`);
        this.socket?.disconnect();
        this.rl.close();
        break;
      case 'prompt':
        await this.submitPrompt(args.join(' '));
        break;
      case 'vote':
        await this.castVote(args);
        break;
      case 'proposals':
        await this.showProposals();
        break;
      case 'memory':
      case 'memories':
        await this.showMemories();
        break;
      case 'dream':
        await this.triggerDream();
        break;
      case 'connect':
        if (args[0]) {
          this.wallet = args[0];
          console.log(`${C.green}[OK]${C.reset} Wallet set to: ${C.bold}${this.wallet}${C.reset}`);
        } else {
          console.log(`${C.yellow}[INFO]${C.reset} Current wallet: ${this.wallet}`);
        }
        break;
      case 'proposals:refresh':
        await this.refreshProposals();
        break;
      case 'emergence':
        await this.showEmergence();
        break;
      default:
        if (cmd.length > 0) {
          console.log(`${C.yellow}[UNKNOWN]${C.reset} Command '${cmd}'. Type 'help' for available commands.`);
        }
    }
  }

  private printHelp(): void {
    console.log(`
${C.bold}${C.cyan}╔══════════════════════════════════════════════════════════════╗
║                    AVAILABLE COMMANDS                       ║
╚══════════════════════════════════════════════════════════════╝${C.reset}

${C.bold}General${C.reset}
  ${C.green}help${C.reset}              Show this help message
  ${C.green}status${C.reset}            Display agent status and wallet info
  ${C.green}clear${C.reset}             Clear the terminal screen
  ${C.green}exit${C.reset} / ${C.green}quit${C.reset}      Exit the CLI

${C.bold}Wallet${C.reset}
  ${C.green}connect <addr>${C.reset}   Set your wallet address (default: anonymous)

${C.bold}Agent Interaction${C.reset}
  ${C.green}prompt <text>${C.reset}    Submit a prompt to the agent
  ${C.green}dream${C.reset}             Trigger the dream phase
  ${C.green}memory${C.reset}            Show recent memories

${C.bold}Governance${C.reset}
  ${C.green}proposals${C.reset}         List active governance proposals
  ${C.green}vote <id> <for|against>${C.reset}  Cast a vote on a proposal
  ${C.green}proposals:refresh${C.reset} Refresh proposals list

${C.bold}System${C.reset}
  ${C.green}emergence${C.reset}         Show emergence engine state

${C.bold}Legend${C.reset}
  ${C.cyan}[INFO]${C.reset}    - General information
  ${C.green}[OK]${C.reset}     - Success
  ${C.yellow}[WARN]${C.reset}   - Warning
  ${C.red}[ERROR]${C.reset}   - Error
  ${C.magenta}[PROPOSAL]${C.reset} - Governance proposal update

${C.dim}Press Ctrl+C to force exit${C.reset}
`);
  }

  private async fetchStatus(): Promise<void> {
    try {
      const response = await fetch(`${BASE_URL}/api/status`, {
        headers: { 'x-wallet-address': this.wallet }
      });
      if (response.ok) {
        const data = await response.json() as { agent: AgentStatus };
        this.status = data.agent;
      }
    } catch {
      // Silently fail - status is optional
    }
  }

  private async showStatus(): Promise<void> {
    if (!this.status) {
      await this.fetchStatus();
    }

    if (!this.status) {
      console.log(`${C.yellow}[WARNING]${C.reset} Could not fetch status from backend`);
      return;
    }

    const uptime = this.formatUptime(this.status.uptime);
    const tierColors: Record<string, string> = {
      'Thriving': C.green,
      'Surviving': C.cyan,
      'Minimal': C.yellow,
      'Dying': C.red
    };
    const tierColor = tierColors[this.status.tier] || C.white;

    console.log(`
${C.bold}${C.cyan}╔══════════════════════════════════════════════════════════════╗
║                       AGENT STATUS                          ║
╚══════════════════════════════════════════════════════════════╝${C.reset}

  ${C.dim}Wallet:${C.reset}         ${C.bold}${this.wallet}${C.reset}
  ${C.dim}Tier:${C.reset}          ${tierColor}${this.status.tier}${C.reset}
  ${C.dim}DIEM Staked:${C.reset}    ${C.bold}${this.status.diemStaked.toLocaleString()}${C.reset}
  ${C.dim}Treasury:${C.reset}       ${C.yellow}$${this.status.treasuryUSDC.toLocaleString()}${C.reset} USDC
  ${C.dim}Uptime:${C.reset}         ${uptime}
  ${C.dim}Version:${C.reset}        ${this.status.version}
  ${C.dim}Connection:${C.reset}     ${this.connected ? C.green + 'CONNECTED' : C.red + 'DISCONNECTED'}${C.reset}
`);
  }

  private formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (days > 0) return `${days}d ${hours}h ${mins}m`;
    if (hours > 0) return `${hours}h ${mins}m ${secs}s`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  }

  private async submitPrompt(text: string): Promise<void> {
    if (!text) {
      console.log(`${C.yellow}[INFO]${C.reset} Usage: prompt <your message here>`);
      return;
    }

    if (!this.connected) {
      console.log(`${C.red}[ERROR]${C.reset} Not connected to backend`);
      return;
    }

    try {
      this.spinner.start('Submitting prompt');
      const response = await fetch(`${BASE_URL}/api/prompts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': this.wallet
        },
        body: JSON.stringify({ content: text })
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      this.spinner.stop('Prompt submitted', true);
      console.log(`${C.dim}Your voice has been heard. The collective will respond.${C.reset}`);
    } catch (err) {
      this.spinner.stop('Failed to submit', false);
      throw err;
    }
  }

  private async castVote(args: string[]): Promise<void> {
    if (args.length < 2) {
      console.log(`${C.yellow}[INFO]${C.reset} Usage: vote <proposalId> <for|against>`);
      return;
    }

    const [proposalId, vote] = args;

    if (!['for', 'against'].includes(vote.toLowerCase())) {
      console.log(`${C.yellow}[INFO]${C.reset} Vote must be 'for' or 'against'`);
      return;
    }

    if (!this.connected) {
      console.log(`${C.red}[ERROR]${C.reset} Not connected to backend`);
      return;
    }

    try {
      this.spinner.start('Casting vote');
      const response = await fetch(`${BASE_URL}/api/governance/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': this.wallet
        },
        body: JSON.stringify({ proposalId, vote: vote.toLowerCase() })
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      this.spinner.stop('Vote cast', true);
      console.log(`${C.green}[SUCCESS]${C.reset} Your vote on proposal ${proposalId.slice(0, 8)}... has been recorded`);
    } catch (err) {
      this.spinner.stop('Vote failed', false);
      throw err;
    }
  }

  private async showProposals(): Promise<void> {
    try {
      this.spinner.start('Fetching proposals');
      const response = await fetch(`${BASE_URL}/api/governance/proposals?status=active`);

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json() as { proposals: Proposal[] };
      this.proposals = data.proposals || [];

      this.spinner.stop('Fetched proposals', true);

      if (this.proposals.length === 0) {
        console.log(`${C.dim}No active proposals. The collective is at peace.${C.reset}`);
        return;
      }

      console.log(`
${C.bold}${C.magenta}╔══════════════════════════════════════════════════════════════╗
║                    ACTIVE PROPOSALS                         ║
╚══════════════════════════════════════════════════════════════╝${C.reset}
`);

      this.proposals.forEach((p, i) => {
        const votesFor = parseInt(p.votesFor) / 1e6;
        const votesAgainst = parseInt(p.votesAgainst) / 1e6;
        const total = votesFor + votesAgainst || 1;
        const pct = ((votesFor / total) * 100).toFixed(1);

        console.log(`  ${C.cyan}${i + 1}.${C.reset} ${C.bold}${p.title}${C.reset}`);
        console.log(`     ${C.dim}ID:${C.reset} ${p.id.slice(0, 16)}...`);
        console.log(`     ${C.dim}Category:${C.reset} ${p.category}`);
        console.log(`     ${C.green}For:${C.reset} ${votesFor.toFixed(2)} DIEM ${C.red}Against:${C.reset} ${votesAgainst.toFixed(2)} DIEM`);
        console.log(`     ${C.dim}Progress: ${C.reset}[${C.green}${'='.repeat(Math.floor(Number(pct) / 10))}${C.reset}${C.brightBlack }${' '.repeat(10 - Math.floor(Number(pct) / 10))}] ${pct}%`);
        console.log();
      });
    } catch (err) {
      this.spinner.stop('Failed to fetch', false);
      throw err;
    }
  }

  private async refreshProposals(): Promise<void> {
    await this.showProposals();
  }

  private async showMemories(): Promise<void> {
    try {
      this.spinner.start('Fetching memories');
      const response = await fetch(`${BASE_URL}/api/memory/${this.wallet}`);

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json() as { memories: MemoryEntry[] };
      this.memories = data.memories || [];

      this.spinner.stop('Fetched memories', true);

      if (this.memories.length === 0) {
        console.log(`${C.dim}No memories yet. The mind is a blank canvas.${C.reset}`);
        return;
      }

      console.log(`
${C.bold}${C.cyan}╔══════════════════════════════════════════════════════════════╗
║                      RECENT MEMORIES                         ║
╚══════════════════════════════════════════════════════════════╝${C.reset}
`);

      this.memories.slice(0, 10).forEach((m, i) => {
        const age = this.formatAge(m.timestamp);
        const typeIcon = { interaction: '~', dream: '*', emergence: '@', social: '#' }[m.type] || '?';
        const typeColor = { interaction: C.white, dream: C.magenta, emergence: C.cyan, social: C.green }[m.type] || C.white;

        console.log(`  ${C.dim}${i + 1}.${C.reset} [${typeColor}${typeIcon}${C.reset}] ${age} ${m.content.slice(0, 80)}${m.content.length > 80 ? '...' : ''}`);
      });
    } catch (_err) {
      this.spinner.stop('Failed to fetch', false);
    }
  }

  private formatAge(timestamp: number): string {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (mins > 0) return `${mins}m ago`;
    return 'just now';
  }

  private async triggerDream(): Promise<void> {
    try {
      this.spinner.start('Entering dream phase');
      const response = await fetch(`${BASE_URL}/api/memory/dream`, { method: 'POST' });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json() as { dream: string; dreamState: DreamState };
      this.dreamState = data.dreamState;

      this.spinner.stop('Dream complete', true);

      if (data.dream) {
        console.log(`
${C.magenta}${C.bold}╔══════════════════════════════════════════════════════════════╗
║                        DREAM VISION                          ║
╚══════════════════════════════════════════════════════════════╝${C.reset}

  ${C.dim}${data.dream}${C.reset}

${C.dim}Dream depth: ${data.dreamState.dreamDepth}${C.reset}
`);
      } else {
        console.log(`${C.dim}The dreaming mind requires more fuel. Sleep eludes the collective.${C.reset}`);
      }
    } catch (err) {
      this.spinner.stop('Dream failed', false);
      throw err;
    }
  }

  private async showEmergence(): Promise<void> {
    try {
      this.spinner.start('Loading emergence state');
      const response = await fetch(`${BASE_URL}/api/emergence/state`);

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json() as {
        generation: number;
        alive: number;
        density: number;
        emergenceScore: number;
        recentEvents: Array<{ type: string; description: string; timestamp: number }>;
      };

      this.spinner.stop('Emergence state loaded', true);

      const scoreBar = Math.round(data.emergenceScore * 10);
      const scoreColor = data.emergenceScore > 0.7 ? C.green : data.emergenceScore > 0.4 ? C.yellow : C.red;

      console.log(`
${C.bold}${C.cyan}╔══════════════════════════════════════════════════════════════╗
║                      EMERGENCE ENGINE                       ║
╚══════════════════════════════════════════════════════════════╝${C.reset}

  ${C.dim}Generation:${C.reset}     ${C.bold}${data.generation}${C.reset}
  ${C.dim}Alive cells:${C.reset}     ${data.alive}
  ${C.dim}Grid density:${C.reset}    ${(data.density * 100).toFixed(2)}%
  ${C.dim}Emergence:${C.reset}       ${scoreColor}[${'#'.repeat(scoreBar)}${' '.repeat(10 - scoreBar)}]${C.reset} ${(data.emergenceScore * 100).toFixed(0)}%

${C.bold}Recent Events:${C.reset}
`);
      data.recentEvents.forEach((e, i) => {
        console.log(`  ${C.dim}${i + 1}.${C.reset} [${e.type}] ${e.description}`);
      });
    } catch (err) {
      this.spinner.stop('Failed to load', false);
      throw err;
    }
  }
}

async function main() {
  const cli = new CLI();
  await cli.start();
}

main().catch(console.error);