/**
 * SERVICE LAYER: Business Logic
 * 
 * This class contains all business logic for rule management.
 * It orchestrates between parser, evaluator, and repository layers.
 * 
 * Responsibilities:
 * - Input validation and sanitization
 * - Expression parsing and AST caching
 * - Rule CRUD operations
 * - Rule evaluation against data
 * 
 * Key Performance Optimization:
 * - AST caching: Parse expression once, reuse for all evaluations (5-10x faster)
 */

import { Rule, RuleRepository, EvaluationResult } from '../domain/rule';
import { Expression } from '../domain/ast';
import { parseExpression } from '../parser/parser';
import { Evaluator } from '../evaluator/evaluator';

// Input validation limits to prevent abuse
const MAX_ID_LENGTH = 100;              // Rule IDs limited to 100 characters
const MAX_EXPRESSION_LENGTH = 1000;     // Expressions limited to 1000 characters
const MAX_DESCRIPTION_LENGTH = 500;     // Descriptions limited to 500 characters

export class RuleService {
  /**
   * AST Cache: Maps rule ID to parsed Abstract Syntax Tree
   * Key performance optimization - parsing is expensive, caching is cheap
   * Example: {"rule1" → AST object, "rule2" → AST object}
   */
  private astCache: Map<string, Expression> = new Map();

  /**
   * Constructor
   * @param repository - RuleRepository instance for data persistence
   */
  constructor(private repository: RuleRepository) {}

  /**
   * CREATE RULE
   * Creates a new rule with validation, parsing, caching, and storage
   * 
   * Process Flow:
   * 1. Sanitize inputs (trim whitespace)
   * 2. Validate required fields and length limits
   * 3. Check for duplicate rule ID
   * 4. Parse expression into AST (validates syntax)
   * 5. Cache AST for future evaluations
   * 6. Create rule object with timestamps
   * 7. Save to repository
   * 
   * @param id - Unique identifier for the rule
   * @param expression - Boolean expression (e.g., "age >= 18 AND country = 'US'")
   * @param description - Optional human-readable description
   * @returns Created rule object with timestamps
   * @throws Error if validation fails or rule already exists
   */
  async createRule(
    id: string,
    expression: string,
    description?: string
  ): Promise<Rule> {
    // STEP 1: INPUT SANITIZATION
    // Remove leading/trailing whitespace from all inputs
    id = id?.trim() || '';
    expression = expression?.trim() || '';
    description = description?.trim();

    // STEP 2: VALIDATION - Check required fields
    if (!id) {
      throw new Error('Rule ID cannot be empty');
    }

    if (id.length > MAX_ID_LENGTH) {
      throw new Error(`Rule ID cannot exceed ${MAX_ID_LENGTH} characters`);
    }

    if (!expression) {
      throw new Error('Expression cannot be empty');
    }

    if (expression.length > MAX_EXPRESSION_LENGTH) {
      throw new Error(`Expression cannot exceed ${MAX_EXPRESSION_LENGTH} characters`);
    }

    if (description && description.length > MAX_DESCRIPTION_LENGTH) {
      throw new Error(`Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters`);
    }

    // STEP 3: CHECK FOR DUPLICATES
    // Prevent creating rules with same ID
    if (await this.repository.exists(id)) {
      throw new Error(`Rule with id '${id}' already exists`);
    }

    // STEP 4: VALIDATE & CACHE EXPRESSION
    // Parse expression into AST (validates syntax) and cache for performance
    const ast = this.validateAndCacheExpression(id, expression);

    // STEP 5: CREATE RULE OBJECT
    // Add timestamps for audit trail
    const now = new Date();
    const rule: Rule = {
      id,
      expression,
      description,
      createdAt: now,  // When rule was created
      updatedAt: now,  // When rule was last modified (same as created initially)
    };

    // STEP 6: SAVE TO REPOSITORY
    await this.repository.create(rule);
    return rule;
  }

  /**
   * GET RULE BY ID
   * Retrieves a single rule by its unique identifier
   * 
   * @param id - Unique identifier of the rule
   * @returns Rule object if found
   * @throws Error if rule doesn't exist
   */
  async getRule(id: string): Promise<Rule> {
    const rule = await this.repository.getById(id);
    if (!rule) {
      throw new Error(`No rule found with id: ${id}`);
    }
    return rule;
  }

  /**
   * GET ALL RULES
   * Retrieves all rules from the repository
   * 
   * @returns Array of all rule objects
   */
  async getAllRules(): Promise<Rule[]> {
    return this.repository.getAll();
  }

  /**
   * UPDATE RULE
   * Updates an existing rule's expression and/or description
   * 
   * Process Flow:
   * 1. Fetch existing rule (throws if not found)
   * 2. Sanitize new inputs
   * 3. Validate new expression and length limits
   * 4. Parse new expression and update cache
   * 5. Update rule properties and timestamp
   * 6. Save updated rule to repository
   * 
   * Note: Rule ID cannot be changed (immutable)
   * 
   * @param id - Unique identifier of the rule to update
   * @param expression - New boolean expression
   * @param description - New description (optional)
   * @returns Updated rule object
   * @throws Error if rule doesn't exist or validation fails
   */
  async updateRule(
    id: string,
    expression: string,
    description?: string
  ): Promise<Rule> {
    // STEP 1: FETCH EXISTING RULE
    // This also validates that the rule exists
    const rule = await this.getRule(id);

    // STEP 2: INPUT SANITIZATION
    expression = expression?.trim() || '';
    description = description?.trim();

    // STEP 3: VALIDATION
    if (!expression) {
      throw new Error('Expression cannot be empty');
    }

    if (expression.length > MAX_EXPRESSION_LENGTH) {
      throw new Error(`Expression cannot exceed ${MAX_EXPRESSION_LENGTH} characters`);
    }

    if (description && description.length > MAX_DESCRIPTION_LENGTH) {
      throw new Error(`Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters`);
    }

    // STEP 4: VALIDATE & UPDATE CACHE
    // Parse new expression and replace old AST in cache
    this.validateAndCacheExpression(id, expression);

    // STEP 5: UPDATE RULE PROPERTIES
    rule.expression = expression;
    rule.description = description;
    rule.updatedAt = new Date(); // Update timestamp to track when modified

    // STEP 6: SAVE TO REPOSITORY
    await this.repository.update(rule);
    return rule;
  }

  /**
   * DELETE RULE
   * Permanently removes a rule from the repository and clears its cached AST
   * 
   * @param id - Unique identifier of the rule to delete
   * @throws Error if rule doesn't exist
   */
  async deleteRule(id: string): Promise<void> {
    // Delete from repository (throws if not found)
    await this.repository.delete(id);
    
    // Clear cached AST to free memory
    this.astCache.delete(id);
  }

  /**
   * EVALUATE RULE
   * Evaluates JSON data against a rule's expression
   * 
   * Process Flow:
   * 1. Fetch rule from repository
   * 2. Get cached AST (or parse and cache if not present)
   * 3. Create evaluator with data
   * 4. Traverse AST tree and compare data values
   * 5. Return result with clause-by-clause details
   * 
   * Performance: Uses cached AST for 5-10x faster evaluation
   * 
   * Example:
   * Rule: "age >= 18 AND country = 'US'"
   * Data: {age: 25, country: "US"}
   * Result: {ruleId: "rule1", result: true, details: [...]}
   * 
   * @param id - Unique identifier of the rule
   * @param data - Object with field-value pairs to evaluate
   * @returns Evaluation result with overall result and per-clause details
   * @throws Error if rule doesn't exist or evaluation fails
   */
  async evaluateRule(
    id: string,
    data: Record<string, any>
  ): Promise<EvaluationResult> {
    // STEP 1: FETCH RULE
    const rule = await this.getRule(id);

    try {
      // STEP 2: GET OR CREATE CACHED AST
      // Check if AST is already in cache
      let expr = this.astCache.get(id);
      if (!expr) {
        // AST not cached yet - parse expression and cache it
        expr = parseExpression(rule.expression);
        this.astCache.set(id, expr);
      }
      // Now expr contains the AST (either from cache or freshly parsed)

      // STEP 3: CREATE EVALUATOR WITH DATA
      // Evaluator will use this data to compare against expression
      const evaluator = new Evaluator(data);
      
      // STEP 4: EVALUATE AST
      // Traverses the tree and compares values
      // Example: age >= 18 → get data.age (25) → compare 25 >= 18 → true
      const { result, details } = evaluator.evaluate(expr);

      // STEP 5: RETURN RESULT
      return {
        ruleId: rule.id,
        result,    // Overall result: true or false
        details,   // Per-clause results: [{clause: "age >= 18", result: true}, ...]
      };
    } catch (error) {
      throw new Error(
        `Failed to evaluate rule: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * VALIDATE AND CACHE EXPRESSION
   * Private helper method that parses expression and caches the AST
   * 
   * This is called during create and update operations to:
   * 1. Validate that expression syntax is correct (parsing fails if syntax error)
   * 2. Cache the AST for fast future evaluations
   * 
   * @param id - Rule ID to use as cache key
   * @param expression - Boolean expression string to parse
   * @returns Parsed AST (Abstract Syntax Tree)
   * @throws Error if expression has invalid syntax
   */
  private validateAndCacheExpression(id: string, expression: string): Expression {
    try {
      // Parse expression into AST
      // This validates syntax - throws error if malformed
      // Example: "age >= 18" → BinaryExpression(Identifier("age"), ">=", NumberLiteral(18))
      const ast = parseExpression(expression);
      
      // Cache AST for future evaluations (performance optimization)
      this.astCache.set(id, ast);
      
      return ast;
    } catch (error) {
      // Wrap error with InvalidExpression prefix for handler to recognize
      throw new Error(
        `InvalidExpression: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * CLEAR CACHE
   * Removes all cached ASTs from memory
   * Useful for testing or maintenance
   */
  clearCache(): void {
    this.astCache.clear();
  }

  /**
   * GET CACHE SIZE
   * Returns the number of cached ASTs
   * Used by health check endpoint to monitor cache usage
   * 
   * @returns Number of rules with cached ASTs
   */
  getCacheSize(): number {
    return this.astCache.size;
  }
}
