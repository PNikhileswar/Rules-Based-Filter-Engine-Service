/**
 * IN-MEMORY REPOSITORY
 * 
 * Implements RuleRepository interface using JavaScript Map for storage.
 * Data is stored in RAM and is volatile (lost on server restart).
 * 
 * Perfect for:
 * - Development and testing
 * - Demos and prototypes
 * - Simple deployments without database requirements
 * 
 * Performance characteristics:
 * - create(): O(1) - instant insertion
 * - getById(): O(1) - instant lookup by key
 * - getAll(): O(n) - must iterate all rules
 * - update(): O(1) - instant replacement
 * - delete(): O(1) - instant removal
 * - exists(): O(1) - instant check
 * 
 * Thread Safety:
 * Single-threaded Node.js makes this safe by default.
 * No need for locks/mutexes like in Go or Java.
 * 
 * Production Alternative:
 * Easy to swap with database implementation:
 * - PostgresRepository (relational)
 * - MongoRepository (document)
 * - RedisRepository (cache)
 * Just implement RuleRepository interface - no other code changes needed!
 */

import { Rule, RuleRepository } from '../domain/rule';

export class MemoryRepository implements RuleRepository {
  /**
   * Internal storage using JavaScript Map
   * Map provides O(1) lookups and is perfect for key-value storage
   * 
   * Structure: Map<ruleId, Rule>
   * Example: {"rule1" → {id: "rule1", expression: "...", ...}}
   * 
   * Why Map instead of Object?
   * - Guaranteed insertion order
   * - Better performance for frequent add/delete
   * - Keys can be any type (not just strings)
   * - Has size property
   */
  private rules: Map<string, Rule> = new Map();

  /**
   * CREATE RULE
   * Adds a new rule to the repository
   * 
   * Process:
   * 1. Check if rule ID already exists (prevent duplicates)
   * 2. Insert into Map
   * 
   * @param rule - Rule entity to store
   * @throws Error if rule with same ID already exists
   */
  async create(rule: Rule): Promise<void> {
    // Prevent duplicate IDs
    if (this.rules.has(rule.id)) {
      throw new Error(`Rule with id '${rule.id}' already exists`);
    }
    // Store rule in Map (O(1) operation)
    this.rules.set(rule.id, rule);
  }

  /**
   * GET RULE BY ID
   * Retrieves a single rule by its unique identifier
   * 
   * @param id - Unique identifier of the rule
   * @returns Rule if found, null if not found
   */
  async getById(id: string): Promise<Rule | null> {
    // Map.get() returns undefined if key doesn't exist
    // We convert undefined to null for consistency
    return this.rules.get(id) || null;
  }

  /**
   * GET ALL RULES
   * Retrieves all rules from the repository
   * 
   * @returns Array of all rule objects
   */
  async getAll(): Promise<Rule[]> {
    // Convert Map values to array
    // this.rules.values() returns an iterator, Array.from() converts to array
    return Array.from(this.rules.values());
  }

  /**
   * UPDATE RULE
   * Updates an existing rule in the repository
   * 
   * Process:
   * 1. Verify rule exists
   * 2. Replace old rule with new rule
   * 
   * Note: Since Map.set() replaces existing keys,
   * we just need to check existence first
   * 
   * @param rule - Updated rule entity
   * @throws Error if rule doesn't exist
   */
  async update(rule: Rule): Promise<void> {
    // Verify rule exists before updating
    if (!this.rules.has(rule.id)) {
      throw new Error(`No rule found with id: ${rule.id}`);
    }
    // Replace old rule with new rule (O(1) operation)
    this.rules.set(rule.id, rule);
  }

  /**
   * DELETE RULE
   * Permanently removes a rule from the repository
   * 
   * @param id - Unique identifier of the rule to delete
   * @throws Error if rule doesn't exist
   */
  async delete(id: string): Promise<void> {
    // Verify rule exists before deleting
    if (!this.rules.has(id)) {
      throw new Error(`No rule found with id: ${id}`);
    }
    // Remove from Map (O(1) operation)
    this.rules.delete(id);
  }

  /**
   * EXISTS CHECK
   * Checks if a rule with given ID exists
   * 
   * Used to prevent duplicate IDs during creation
   * 
   * @param id - Unique identifier to check
   * @returns true if rule exists, false otherwise
   */
  async exists(id: string): Promise<boolean> {
    // Map.has() is O(1) operation
    return this.rules.has(id);
  }
}
