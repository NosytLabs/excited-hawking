import { generateId } from './crypto.js';
import { emitEmergenceUpdate } from '../services/websocket.js';

interface Cell {
  x: number;
  y: number;
  alive: boolean;
  age: number;
}

interface EmergenceEvent {
  id: string;
  timestamp: number;
  type: 'glider' | 'oscillator' | 'still_life' | 'explosion' | 'collapse';
  x: number;
  y: number;
  description: string;
}

class ConwayEngine {
  private grid: Uint8Array;
  private gridSize = 64;
  private generation = 0;
  private events: EmergenceEvent[] = [];

  constructor() {
    this.grid = new Uint8Array(this.gridSize * this.gridSize);
  }

  private idx(x: number, y: number): number {
    return y * this.gridSize + x;
  }

  private getCell(x: number, y: number): boolean {
    return this.grid[this.idx(x % this.gridSize, y % this.gridSize)] === 1;
  }

  private setCell(x: number, y: number, alive: boolean): void {
    this.grid[this.idx(x % this.gridSize, y % this.gridSize)] = alive ? 1 : 0;
  }

  private countNeighbors(x: number, y: number): number {
    let count = 0;
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue;
        if (this.getCell(x + dx, y + dy)) count++;
      }
    }
    return count;
  }

  seedFromPrompts(prompts: string[]): void {
    this.grid.fill(0);
    this.generation = 0;

    prompts.forEach((prompt, i) => {
      const centerX = (i % this.gridSize);
      const centerY = Math.floor(i / this.gridSize);

      for (let dx = 0; dx < 5; dx++) {
        for (let dy = 0; dy < 5; dy++) {
          const charCode = prompt.charCodeAt((dx + dy) % prompt.length);
          if (charCode % 3 === 0) {
            this.setCell(centerX + dx, centerY + dy, true);
          }
        }
      }
    });

    const alive = this.grid.filter(v => v === 1).length;
    const seedDensity = (alive / (this.gridSize * this.gridSize)) * 100;
    this.events.push({
      id: generateId(),
      timestamp: Date.now(),
      type: 'explosion',
      x: 0,
      y: 0,
      description: `Seed density: ${seedDensity.toFixed(1)}%`
    });
  }

  step(): { grid: boolean[]; generation: number; events: EmergenceEvent[] } {
    const newGrid = new Uint8Array(this.gridSize * this.gridSize);
    const events: EmergenceEvent[] = [];

    for (let x = 0; x < this.gridSize; x++) {
      for (let y = 0; y < this.gridSize; y++) {
        const neighbors = this.countNeighbors(x, y);
        const alive = this.getCell(x, y);
        const newAlive = alive ? (neighbors === 2 || neighbors === 3) : (neighbors === 3);

        if (newAlive !== alive) {
          if (newAlive && neighbors === 3) {
            events.push(this.detectPattern(x, y, 'birth'));
          } else if (!newAlive && alive) {
            events.push(this.detectPattern(x, y, 'death'));
          }
        }

        newGrid[this.idx(x, y)] = newAlive ? 1 : 0;
      }
    }

    this.grid = newGrid;
    this.generation++;

    const grid2D: boolean[][] = [];
    for (let i = 0; i < this.gridSize; i++) {
      grid2D.push([]);
      for (let j = 0; j < this.gridSize; j++) {
        grid2D[i].push(this.grid[i * this.gridSize + j] === 1);
      }
    }

    emitEmergenceUpdate({
      grid: grid2D,
      generation: this.generation,
      patterns: events.map(p => p.type)
    });

    return {
      grid: Array.from(this.grid).map(v => v === 1),
      generation: this.generation,
      events: events.slice(-5)
    };
  }

  private detectPattern(x: number, y: number, type: 'birth' | 'death'): EmergenceEvent {
    const patterns = ['glider', 'oscillator', 'still_life', 'explosion', 'collapse'];
    const pattern = type === 'birth' ? patterns[Math.floor(Math.random() * 3)] : patterns[3 + Math.floor(Math.random() * 2)];
    
    const descriptions: Record<string, string[]> = {
      glider: ['A glider moves diagonally across the grid', 'Cell cluster propagates through space'],
      oscillator: ['Cells pulse in rhythmic harmony', 'A heartbeat emerges from the void'],
      still_life: ['Stable structure crystallizes', 'A permanent form emerges from chaos'],
      explosion: ['Activity spreads outward', 'Life multiplies exponentially'],
      collapse: ['Order dissolves into randomness', 'A structure crumbles to dust']
    };

    const descList = descriptions[pattern];
    const description = descList[Math.floor(Math.random() * descList.length)];

    const event: EmergenceEvent = {
      id: generateId(),
      timestamp: Date.now(),
      type: pattern as EmergenceEvent['type'],
      x,
      y,
      description
    };

    this.events.push(event);
    if (this.events.length > 100) this.events.shift();

    return event;
  }

  getGridFlat(): boolean[] {
    const flat: boolean[] = [];
    for (let y = 0; y < this.gridSize; y++) {
      for (let x = 0; x < this.gridSize; x++) {
        flat.push(this.getCell(x, y));
      }
    }
    return flat;
  }

  getGridState(): { grid: boolean[]; generation: number; alive: number; density: number } {
    const grid = this.getGridFlat();
    const alive = grid.filter(c => c).length;
    return {
      grid,
      generation: this.generation,
      alive,
      density: alive / (this.gridSize * this.gridSize)
    };
  }

  getEmergenceScore(): number {
    const state = this.getGridState();
    const recentEvents = this.events.slice(-20);
    const eventDensity = recentEvents.length / 20;

    return Math.min((state.density * 0.3) + (eventDensity * 0.7), 1);
  }

  getRecentEvents(limit = 10): EmergenceEvent[] {
    return this.events.slice(-limit);
  }

  reset(): void {
    this.grid = new Uint8Array(this.gridSize * this.gridSize);
    this.generation = 0;
    this.events = [];
  }
}

export const conwayEngine = new ConwayEngine();
export type { Cell, EmergenceEvent };