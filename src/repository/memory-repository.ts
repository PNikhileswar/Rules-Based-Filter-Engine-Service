// In-memory repository with thread-safe operations

import { Rule, RuleRepository } from '../domain/rule';

export class MemoryRepository implements RuleRepository {
  private rules: Map<string, Rule> = new Map();

  async create(rule: Rule): Promise<void> {
    if (this.rules.has(rule.id)) {
      throw new Error(`Rule with id '${rule.id}' already exists`);
    }
    this.rules.set(rule.id, rule);
  }

  async getById(id: string): Promise<Rule | null> {
    return this.rules.get(id) || null;
  }

  async getAll(): Promise<Rule[]> {
    return Array.from(this.rules.values());
  }

  async update(rule: Rule): Promise<void> {
    if (!this.rules.has(rule.id)) {
      throw new Error(`No rule found with id: ${rule.id}`);
    }
    this.rules.set(rule.id, rule);
  }

  async delete(id: string): Promise<void> {
    if (!this.rules.has(id)) {
      throw new Error(`No rule found with id: ${id}`);
    }
    this.rules.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    return this.rules.has(id);
  }
}
