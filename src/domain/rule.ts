/**
 * DOMAIN LAYER: Core Entities and Interfaces
 * 
 * This file defines the fundamental business entities and contracts (interfaces)
 * that are used throughout the application. Domain layer has zero external
 * dependencies and represents pure business concepts.
 * 
 * Following Domain-Driven Design (DDD) principles.
 */

/**
 * RULE ENTITY
 * Represents a rule in the system with its expression and metadata
 * 
 * A rule is the core entity - it contains a boolean expression that can be
 * evaluated against data to determine if the data matches the rule.
 * 
 * Example:
 * {
 *   id: "adult_users",
 *   expression: "age >= 18 AND country = 'US'",
 *   description: "Adult users in the United States",
 *   createdAt: Date("2025-11-29T10:00:00Z"),
 *   updatedAt: Date("2025-11-29T10:00:00Z")
 * }
 */
export interface Rule {
  /** Unique identifier for the rule (immutable) */
  id: string;
  
  /** Boolean expression to evaluate (e.g., "age >= 18 AND country = 'US'") */
  expression: string;
  
  /** Optional human-readable description of what the rule checks */
  description?: string;
  
  /** Timestamp when the rule was created (for audit trail) */
  createdAt: Date;
  
  /** Timestamp when the rule was last modified (for audit trail) */
  updatedAt: Date;
}

/**
 * RULE REPOSITORY INTERFACE
 * Contract for rule persistence operations
 * 
 * This interface allows us to swap implementations easily:
 * - Current: MemoryRepository (Map-based in-memory storage)
 * - Future: PostgresRepository, MongoRepository, etc.
 * 
 * Following Repository Pattern - abstracts data access logic
 */
export interface RuleRepository {
  /**
   * Create a new rule
   * @param rule - Rule entity to persist
   * @throws Error if rule with same ID already exists
   */
  create(rule: Rule): Promise<void>;
  
  /**
   * Retrieve a rule by its unique identifier
   * @param id - Unique identifier of the rule
   * @returns Rule if found, null otherwise
   */
  getById(id: string): Promise<Rule | null>;
  
  /**
   * Retrieve all rules
   * @returns Array of all rules in the system
   */
  getAll(): Promise<Rule[]>;
  
  /**
   * Update an existing rule
   * @param rule - Updated rule entity
   * @throws Error if rule doesn't exist
   */
  update(rule: Rule): Promise<void>;
  
  /**
   * Delete a rule permanently
   * @param id - Unique identifier of the rule to delete
   * @throws Error if rule doesn't exist
   */
  delete(id: string): Promise<void>;
  
  /**
   * Check if a rule exists
   * @param id - Unique identifier to check
   * @returns true if rule exists, false otherwise
   */
  exists(id: string): Promise<boolean>;
}

/**
 * EVALUATION RESULT
 * Contains the outcome of evaluating data against a rule
 * 
 * Provides both overall result and detailed per-clause results
 * for debugging and transparency.
 * 
 * Example:
 * {
 *   ruleId: "adult_users",
 *   result: true,
 *   details: [
 *     {clause: "age >= 18", result: true},
 *     {clause: "country = 'US'", result: true}
 *   ]
 * }
 */
export interface EvaluationResult {
  /** ID of the rule that was evaluated */
  ruleId: string;
  
  /** Overall result: true if all conditions pass, false otherwise */
  result: boolean;
  
  /** Detailed results for each clause in the expression */
  details: ClauseDetails[];
}

/**
 * CLAUSE DETAILS
 * Details about a single clause evaluation
 * 
 * Used to show which specific conditions passed or failed,
 * helpful for debugging why a rule didn't match.
 * 
 * Example:
 * {clause: "age >= 18", result: false}
 * Tells us the user didn't meet the age requirement
 */
export interface ClauseDetails {
  /** The clause expression (e.g., "age >= 18") */
  clause: string;
  
  /** Whether this clause evaluated to true or false */
  result: boolean;
}
