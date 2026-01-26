/**
 * In-memory storage implementation for testing
 */
export class InMemoryStorage {
    memories = new Map();
    async save(memory) {
        this.memories.set(memory.id, { ...memory });
    }
    async get(id) {
        const memory = this.memories.get(id);
        return memory ? { ...memory } : null;
    }
    async update(id, updates) {
        const existing = this.memories.get(id);
        if (!existing) {
            throw new Error(`Memory not found: ${id}`);
        }
        const updated = {
            ...existing,
            ...updates,
            metadata: {
                ...existing.metadata,
                ...updates.metadata,
                updatedAt: new Date(),
            },
        };
        this.memories.set(id, updated);
        return { ...updated };
    }
    async softDelete(id) {
        const memory = this.memories.get(id);
        if (memory) {
            memory.isDeleted = true;
            this.memories.set(id, memory);
        }
    }
    async hardDelete(id) {
        this.memories.delete(id);
    }
    async vectorSearch(queryVector, userId, tenantId, options = {}) {
        const results = [];
        for (const memory of this.memories.values()) {
            // Apply filters
            if (memory.userId !== userId)
                continue;
            if (memory.tenantId !== tenantId)
                continue;
            if (memory.isDeleted && !options.includeDeleted)
                continue;
            if (options.excludeIds?.includes(memory.id))
                continue;
            if (options.types?.length && !options.types.includes(memory.type))
                continue;
            if (options.tiers?.length && !options.tiers.includes(memory.tier))
                continue;
            if (options.tags?.length && !options.tags.some(t => memory.tags.includes(t)))
                continue;
            // Chatbot filter
            if (options.chatbotId) {
                if (memory.chatbotId !== options.chatbotId) {
                    if (!options.includeGlobal || memory.chatbotId)
                        continue;
                }
            }
            // Calculate similarity
            if (!memory.embedding)
                continue;
            const similarity = this.cosineSimilarity(queryVector, memory.embedding.vector);
            if (options.minSimilarity && similarity < options.minSimilarity)
                continue;
            results.push({ memory: { ...memory }, similarity });
        }
        // Sort by similarity
        results.sort((a, b) => b.similarity - a.similarity);
        // Apply limit
        return options.limit ? results.slice(0, options.limit) : results;
    }
    async findByCriteria(criteria) {
        const results = [];
        const now = Date.now();
        for (const memory of this.memories.values()) {
            if (memory.tenantId !== criteria.tenantId)
                continue;
            if (criteria.userId && memory.userId !== criteria.userId)
                continue;
            if (criteria.chatbotId && memory.chatbotId !== criteria.chatbotId)
                continue;
            if (criteria.types?.length && !criteria.types.includes(memory.type))
                continue;
            if (criteria.tags?.length && !criteria.tags.some(t => memory.tags.includes(t)))
                continue;
            if (criteria.memoryIds?.length && !criteria.memoryIds.includes(memory.id))
                continue;
            if (criteria.maxDecayScore !== undefined && memory.decay.score > criteria.maxDecayScore)
                continue;
            if (criteria.olderThanDays !== undefined) {
                const ageMs = now - memory.metadata.createdAt.getTime();
                const ageDays = ageMs / (1000 * 60 * 60 * 24);
                if (ageDays < criteria.olderThanDays)
                    continue;
            }
            results.push({ ...memory });
        }
        return results;
    }
    async getForConsolidation(tenantId, userId, options = {}) {
        const results = [];
        const now = Date.now();
        const minAgeMs = (options.minAgeHours ?? 24) * 60 * 60 * 1000;
        for (const memory of this.memories.values()) {
            if (memory.tenantId !== tenantId)
                continue;
            if (userId && memory.userId !== userId)
                continue;
            if (memory.isDeleted)
                continue;
            if (memory.tier === 'episodic')
                continue; // Don't consolidate archived
            const ageMs = now - memory.metadata.createdAt.getTime();
            if (ageMs < minAgeMs)
                continue;
            results.push({ ...memory });
        }
        // Sort by decay score (lowest first = needs attention)
        results.sort((a, b) => a.decay.score - b.decay.score);
        return options.limit ? results.slice(0, options.limit) : results;
    }
    async countByUser(userId, tenantId) {
        let count = 0;
        for (const memory of this.memories.values()) {
            if (memory.userId === userId && memory.tenantId === tenantId && !memory.isDeleted) {
                count++;
            }
        }
        return count;
    }
    async updateTier(id, tier) {
        const memory = this.memories.get(id);
        if (memory) {
            memory.tier = tier;
            memory.metadata.updatedAt = new Date();
        }
    }
    async updateDecay(id, score) {
        const memory = this.memories.get(id);
        if (memory) {
            memory.decay.score = score;
            memory.decay.lastCalculated = new Date();
        }
    }
    async updateAccess(id, accessedAt) {
        const memory = this.memories.get(id);
        if (memory) {
            memory.metadata.lastAccessedAt = accessedAt;
            memory.metadata.accessCount++;
        }
    }
    async saveBatch(memories) {
        for (const memory of memories) {
            await this.save(memory);
        }
    }
    async deleteBatch(ids, hard = false) {
        for (const id of ids) {
            if (hard) {
                await this.hardDelete(id);
            }
            else {
                await this.softDelete(id);
            }
        }
    }
    async cleanupExpired() {
        const now = Date.now();
        let count = 0;
        for (const [id, memory] of this.memories) {
            if (memory.expiresAt && memory.expiresAt.getTime() < now) {
                this.memories.delete(id);
                count++;
            }
        }
        return count;
    }
    async healthCheck() {
        return true;
    }
    // Helper for testing
    clear() {
        this.memories.clear();
    }
    cosineSimilarity(a, b) {
        if (a.length !== b.length)
            return 0;
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }
}
//# sourceMappingURL=storage.js.map