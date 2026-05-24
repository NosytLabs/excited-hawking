// Skills registry for hot reload and discovery
// Inspired by Hermes Agent's skills system

import * as fs from 'fs';
import * as path from 'path';

export interface SkillMetadata {
  name: string;
  description: string;
  version: string;
  category: string;
  platforms: string[];
  tags: string[];
  requiresToolsets?: string[];
  fallbackForToolsets?: string[];
  config?: Record<string, unknown>;
}

export interface Skill {
  metadata: SkillMetadata;
  content: string;
  path: string;
}

class SkillsRegistry {
  private skills: Map<string, Skill> = new Map();
  private watchers: Map<string, fs.FSWatcher> = new Map();
  private skillsDir: string;

  constructor(skillsDir: string) {
    this.skillsDir = skillsDir;
  }

  async loadSkills(): Promise<void> {
    if (!fs.existsSync(this.skillsDir)) {
      console.log('[Skills] Skills directory not found, creating...');
      fs.mkdirSync(this.skillsDir, { recursive: true });
      return;
    }

    const files = fs.readdirSync(this.skillsDir).filter(f => f.endsWith('.md'));
    for (const file of files) {
      await this.loadSkill(file);
    }
    console.log(`[Skills] Loaded ${this.skills.size} skills`);
  }

  private async loadSkill(file: string): Promise<void> {
    try {
      const filePath = path.join(this.skillsDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const metadata = this.parseFrontmatter(content);
      if (metadata.name) {
        this.skills.set(metadata.name, {
          metadata,
          content,
          path: filePath
        });
      }
    } catch (err) {
      console.error(`[Skills] Failed to load ${file}:`, err);
    }
  }

  private parseFrontmatter(content: string): SkillMetadata {
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) {
      return { name: '', description: '', version: '', category: '', platforms: [], tags: [] };
    }

    const lines = frontmatterMatch[1].split('\n');
    const metadata: Record<string, unknown> = {};
    let currentKey = '';
    let currentArray: string[] = [];

    for (const line of lines) {
      const keyMatch = line.match(/^(\w+):\s*(.*)$/);
      if (keyMatch) {
        if (currentKey && currentArray.length > 0) {
          metadata[currentKey] = currentArray;
        }
        currentKey = keyMatch[1];
        const value = keyMatch[2].trim();
        if (value.startsWith('[') && value.endsWith(']')) {
          currentArray = value.slice(1, -1).split(',').map(s => s.trim());
        } else {
          metadata[currentKey] = value;
        }
      }
    }
    if (currentKey && currentArray.length > 0) {
      metadata[currentKey] = currentArray;
    }

    const hermesMeta = (metadata.metadata as Record<string, unknown>)?.hermes as Record<string, unknown> || {};

    return {
      name: metadata.name as string || '',
      description: metadata.description as string || '',
      version: metadata.version as string || '1.0.0',
      category: metadata.category as string || 'general',
      platforms: Array.isArray(metadata.platforms) ? metadata.platforms as string[] : [],
      tags: Array.isArray(hermesMeta.tags) ? hermesMeta.tags as string[] : [],
      requiresToolsets: hermesMeta.requires_toolsets as string[] | undefined,
      fallbackForToolsets: hermesMeta.fallback_for_toolsets as string[] | undefined,
      config: hermesMeta.config as Record<string, unknown> | undefined
    };
  }

  watchSkills(callback: (skill: Skill) => void): void {
    if (!fs.existsSync(this.skillsDir)) return;

    const watcher = fs.watch(this.skillsDir, { persistent: true }, (eventType, filename) => {
      if (eventType === 'change' && filename?.endsWith('.md')) {
        this.loadSkill(filename).then(() => {
          const skill = this.skills.get(filename.replace('.md', ''));
          if (skill) callback(skill);
        });
      }
    });

    this.watchers.set(this.skillsDir, watcher);
  }

  stopWatching(): void {
    for (const watcher of this.watchers.values()) {
      watcher.close();
    }
    this.watchers.clear();
  }

  getSkill(name: string): Skill | undefined {
    return this.skills.get(name);
  }

  listSkills(filter?: { category?: string; tag?: string }): Skill[] {
    let skills = Array.from(this.skills.values());
    if (filter?.category) {
      skills = skills.filter(s => s.metadata.category === filter.category);
    }
    if (filter?.tag) {
      skills = skills.filter(s => s.metadata.tags.includes(filter.tag!));
    }
    return skills;
  }

  getSkillSummaries(): { name: string; description: string; category: string }[] {
    return Array.from(this.skills.values()).map(s => ({
      name: s.metadata.name,
      description: s.metadata.description,
      category: s.metadata.category
    }));
  }
}

const skillsDir = path.join(process.cwd(), 'src', 'skills');
export const skillsRegistry = new SkillsRegistry(skillsDir);