import { ChromaClient, Collection } from 'chromadb';

export interface MemoryEntry {
  id: string;
  embedding: number[];
  document: string;
  metadata: {
    user: string;
    timestamp: number;
    diem_spent: bigint;
    interaction_type: string;
    dream_cycle: number;
  };
}

const COLLECTION_NAME = 'agent_memories';
const EMBEDDING_DIMENSION = 1536;

export class VectorMemoryService {
  private client: ChromaClient | null = null;
  private collection: Collection | null = null;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    this.client = new ChromaClient({
      path: 'http://localhost:8000'
    });

    try {
      this.collection = await this.client.getOrCreateCollection({
        name: COLLECTION_NAME,
        metadata: { dimension: EMBEDDING_DIMENSION }
      });
      this.initialized = true;
      console.log('[VectorMemory] ChromaDB collection initialized');
    } catch (error) {
      console.error('[VectorMemory] Failed to initialize ChromaDB:', error);
      throw error;
    }
  }

  async addMemoryVector(entry: MemoryEntry): Promise<string> {
    if (!this.collection || !this.initialized) {
      await this.initialize();
    }

    const metadata = {
      user: entry.metadata.user,
      timestamp: entry.metadata.timestamp,
      diem_spent: entry.metadata.diem_spent.toString(),
      interaction_type: entry.metadata.interaction_type,
      dream_cycle: entry.metadata.dream_cycle
    };

    await this.collection!.add({
      ids: [entry.id],
      embeddings: [entry.embedding],
      documents: [entry.document],
      metadatas: [metadata]
    });

    return entry.id;
  }

  async queryVectors(
    query: number[],
    limit = 10
  ): Promise<MemoryEntry[]> {
    if (!this.collection || !this.initialized) {
      await this.initialize();
    }

    const results = await this.collection!.query({
      queryEmbeddings: [query],
      nResults: limit
    });

    const memories: MemoryEntry[] = [];

    if (results.ids.length > 0 && results.ids[0].length > 0) {
      for (let i = 0; i < results.ids[0].length; i++) {
        const id = results.ids[0][i];
        const embedding = results.embeddings?.[0]?.[i];
        const document = results.documents?.[0]?.[i];
        const metadata = results.metadatas?.[0]?.[i];

        if (!id || !embedding || !document || !metadata) continue;

        memories.push({
          id,
          embedding,
          document,
          metadata: {
            user: metadata.user as string,
            timestamp: metadata.timestamp as number,
            diem_spent: BigInt(metadata.diem_spent as string),
            interaction_type: metadata.interaction_type as string,
            dream_cycle: metadata.dream_cycle as number
          }
        });
      }
    }

    return memories;
  }

  async deleteVectors(ids: string[]): Promise<void> {
    if (!this.collection || !this.initialized) {
      await this.initialize();
    }

    await this.collection!.delete({
      ids: ids
    });
  }

  isReady(): boolean {
    return this.initialized;
  }
}

export const createVectorMemoryService = () => new VectorMemoryService();
export const vectorMemoryService = new VectorMemoryService();
