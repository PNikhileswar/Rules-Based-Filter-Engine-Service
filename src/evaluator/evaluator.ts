/**
 * EVALUATOR
 * Evaluates Abstract Syntax Tree (AST) against runtime data
 * 
 * Responsibilities:
 * - Tree traversal: Walk through AST nodes recursively
 * - Data lookup: Extract field values from data object
 * - Comparison: Execute operators (=, !=, >, <, >=, <=)
 * - Logical operations: Combine results with AND/OR
 * - Detail tracking: Record each clause evaluation for debugging
 * 
 * Example:
 * Rule: "age > 18 AND status = 'active'"
 * Data: { age: 25, status: "active" }
 * 
 * AST Traversal:
 * 1. LogicalExpression (AND)
 *    ├─ Left: BinaryExpression (age > 18) → true
 *    └─ Right: BinaryExpression (status = 'active') → true
 * 2. Result: true AND true = true
 * 
 * Details tracked:
 * [
 *   { clause: "age > 18", result: true },
 *   { clause: "status = 'active'", result: true }
 * ]
 */

import { TokenType } from '../domain/token';
import {
  Expression,
  BinaryExpression,
  LogicalExpression,
  Identifier,
  NumberLiteral,
  StringLiteral,
} from '../domain/ast';
import { ClauseDetails } from '../domain/rule';

/**
 * EVALUATOR CLASS
 * Traverses AST and evaluates expressions against data
 */
export class Evaluator {
  /** Stores evaluation details for each clause */
  private details: ClauseDetails[] = [];

  /**
   * Constructor
   * 
   * @param data - Runtime data object to evaluate rule against
   *               Example: { age: 25, status: "active", score: 85.5 }
   */
  constructor(private data: Record<string, any>) {}

  /**
   * EVALUATE (Public Entry Point)
   * Main evaluation function - evaluates AST and returns result with details
   * 
   * Process:
   * 1. Reset details array (for fresh evaluation)
   * 2. Recursively evaluate AST tree
   * 3. Return boolean result + clause-by-clause details
   * 
   * Example:
   * Rule: "age > 18 AND status = 'active'"
   * Data: { age: 25, status: "active" }
   * 
   * Returns:
   * {
   *   result: true,
   *   details: [
   *     { clause: "age > 18", result: true },
   *     { clause: "status = 'active'", result: true }
   *   ]
   * }
   * 
   * @param expr - Root AST node to evaluate
   * @returns Object with result (boolean) and details (array of clause evaluations)
   */
  evaluate(expr: Expression): { result: boolean; details: ClauseDetails[] } {
    // Reset details for fresh evaluation
    this.details = [];
    
    // Recursively evaluate AST tree
    const result = this.eval(expr, true);
    
    // Return result with detailed breakdown
    return { result, details: this.details };
  }

  /**
   * EVAL (Recursive Dispatcher)
   * Routes expression to appropriate handler based on node type
   * 
   * AST Node Types:
   * - LogicalExpression: AND/OR operators → evalLogicalExpression
   * - BinaryExpression: Comparison operators (=, !=, >, <, >=, <=) → evalBinaryExpression
   * 
   * Tree Traversal Pattern (Post-Order):
   * For "age > 18 AND status = 'active'":
   * 1. eval(LogicalExpression) → calls evalLogicalExpression
   * 2. evalLogicalExpression calls eval(left: "age > 18") → evalBinaryExpression
   * 3. evalLogicalExpression calls eval(right: "status = 'active'") → evalBinaryExpression
   * 4. Combines results with AND operator
   * 
   * @param expr - AST node to evaluate
   * @param trackDetails - Whether to record clause evaluation details
   * @returns Boolean evaluation result
   * @throws Error if expression type is not recognized
   */
  private eval(expr: Expression, trackDetails: boolean): boolean {
    // Route to logical expression handler (AND, OR)
    if (expr instanceof LogicalExpression) {
      return this.evalLogicalExpression(expr, trackDetails);
    } 
    // Route to binary expression handler (=, !=, >, <, >=, <=)
    else if (expr instanceof BinaryExpression) {
      return this.evalBinaryExpression(expr, trackDetails);
    }
    
    // Unknown expression type (should never happen with valid AST)
    throw new Error(`Unexpected expression type: ${expr.constructor.name}`);
  }

  /**
   * EVAL LOGICAL EXPRESSION
   * Handles AND/OR operators by combining left and right operand results
   * 
   * Process:
   * 1. Recursively evaluate left operand
   * 2. Recursively evaluate right operand
   * 3. Combine results based on operator type
   * 
   * Operators:
   * - AND: Both operands must be true (short-circuit: not implemented)
   * - OR: At least one operand must be true (short-circuit: not implemented)
   * 
   * Example: "age > 18 AND status = 'active'"
   * - leftResult = eval("age > 18") → true
   * - rightResult = eval("status = 'active'") → true
   * - return: true AND true = true
   * 
   * Example: "score < 50 OR verified = true"
   * - leftResult = eval("score < 50") → false
   * - rightResult = eval("verified = true") → true
   * - return: false OR true = true
   * 
   * Note: Currently evaluates both operands always (no short-circuit optimization)
   * This is intentional to track all clause details.
   * 
   * @param expr - LogicalExpression node (AND/OR)
   * @param trackDetails - Whether to record clause evaluations
   * @returns Boolean result of logical operation
   * @throws Error if operator is not AND or OR
   */
  private evalLogicalExpression(
    expr: LogicalExpression,
    trackDetails: boolean
  ): boolean {
    // Evaluate left operand recursively
    const leftResult = this.eval(expr.left, trackDetails);
    
    // Evaluate right operand recursively
    // (No short-circuit to ensure all details are tracked)
    const rightResult = this.eval(expr.right, trackDetails);

    // Combine results based on logical operator
    switch (expr.operator.type) {
      case TokenType.AND:
        // Both must be true
        return leftResult && rightResult;
      case TokenType.OR:
        // At least one must be true
        return leftResult || rightResult;
      default:
        // Invalid operator (should never happen with valid AST)
        throw new Error(`Unknown logical operator: ${expr.operator.literal}`);
    }
  }

  /**
   * EVAL BINARY EXPRESSION
   * Handles comparison operators (=, !=, >, <, >=, <=)
   * 
   * Process:
   * 1. Extract field name from left side (must be Identifier)
   * 2. Look up actual value in data object
   * 3. Extract expected value from right side (NumberLiteral or StringLiteral)
   * 4. Compare actual vs expected using operator
   * 5. Track clause details if requested
   * 6. Return comparison result
   * 
   * Example: "age > 18"
   * - fieldName = "age"
   * - dataValue = this.data["age"] = 25
   * - expectedValue = 18
   * - result = compare(25, ">", 18) = true
   * 
   * Example: "status = 'active'"
   * - fieldName = "status"
   * - dataValue = this.data["status"] = "active"
   * - expectedValue = "active"
   * - result = compare("active", "=", "active") = true
   * 
   * Missing Fields:
   * If field doesn't exist in data, evaluates to false
   * Example: Rule "country = 'US'" with data { age: 25 } → false
   * 
   * @param expr - BinaryExpression node (comparison)
   * @param trackDetails - Whether to record clause evaluation
   * @returns Boolean result of comparison
   * @throws Error if left side is not identifier or right side is not literal
   */
  private evalBinaryExpression(
    expr: BinaryExpression,
    trackDetails: boolean
  ): boolean {
    // Validate left side is an identifier (field name)
    if (!(expr.left instanceof Identifier)) {
      throw new Error('Left side of comparison must be an identifier');
    }

    // Extract field name and look up value in data
    const fieldName = expr.left.value;
    const dataValue = this.data[fieldName];

    // Handle missing fields: treat as false (field doesn't exist)
    if (dataValue === undefined) {
      const result = false;
      if (trackDetails) {
        this.addDetail(this.formatClause(expr), result);
      }
      return result;
    }

    // Extract expected value from right side (literal)
    let expectedValue: any;
    if (expr.right instanceof NumberLiteral) {
      expectedValue = expr.right.value;
    } else if (expr.right instanceof StringLiteral) {
      expectedValue = expr.right.value;
    } else {
      // Right side must be a literal (not another identifier or expression)
      throw new Error('Right side of comparison must be a literal value');
    }

    // Perform comparison using operator
    const result = this.compare(dataValue, expr.operator.type, expectedValue);
    
    // Track clause evaluation details
    if (trackDetails) {
      this.addDetail(this.formatClause(expr), result);
    }

    return result;
  }

  /**
   * COMPARE
   * Routes comparison to appropriate operator handler
   * 
   * Supported Operators:
   * - = (EQUAL): Equality with type coercion
   * - != (NOT_EQUAL): Inequality with type coercion
   * - > (GREATER): Numeric greater than
   * - < (LESS): Numeric less than
   * - >= (GREATER_EQUAL): Numeric greater than or equal
   * - <= (LESS_EQUAL): Numeric less than or equal
   * 
   * Examples:
   * - compare(25, GREATER, 18) → true
   * - compare("active", EQUAL, "active") → true
   * - compare(3.14, EQUAL, "3.14") → true (type coercion)
   * - compare(50, GREATER_EQUAL, 50) → true
   * 
   * @param left - Actual value from data
   * @param operator - Comparison operator type
   * @param right - Expected value from rule
   * @returns Boolean result of comparison
   * @throws Error if operator is not recognized
   */
  private compare(left: any, operator: TokenType, right: any): boolean {
    switch (operator) {
      case TokenType.EQUAL:
        // Equality with type coercion (e.g., 3 == "3")
        return this.equals(left, right);
      case TokenType.NOT_EQUAL:
        // Inequality (negation of equals)
        return !this.equals(left, right);
      case TokenType.GREATER:
        // Numeric comparison: left > right
        return this.greaterThan(left, right);
      case TokenType.LESS:
        // Numeric comparison: left < right
        return this.lessThan(left, right);
      case TokenType.GREATER_EQUAL:
        // Numeric comparison: left >= right (greater OR equal)
        return this.greaterThan(left, right) || this.equals(left, right);
      case TokenType.LESS_EQUAL:
        // Numeric comparison: left <= right (less OR equal)
        return this.lessThan(left, right) || this.equals(left, right);
      default:
        // Invalid operator (should never happen with valid AST)
        throw new Error(`Unknown comparison operator: ${operator}`);
    }
  }

  /**
   * EQUALS
   * Performs equality comparison with type coercion
   * 
   * Comparison Strategy:
   * 1. Strict equality check (===)
   * 2. Numeric coercion (3 == "3" → true)
   * 3. String comparison (case-sensitive)
   * 4. Default to false if types incompatible
   * 
   * Examples:
   * - equals(25, 25) → true (strict equality)
   * - equals(3.14, "3.14") → true (numeric coercion)
   * - equals("active", "active") → true (string equality)
   * - equals(true, "true") → false (no boolean coercion)
   * - equals(null, undefined) → false (different types)
   * 
   * Type Coercion:
   * Allows flexible matching for numeric values received as strings
   * Common in JSON/HTTP where numbers may be stringified
   * 
   * @param left - Actual value from data
   * @param right - Expected value from rule
   * @returns true if values are equal (with coercion), false otherwise
   */
  private equals(left: any, right: any): boolean {
    // Fast path: strict equality (same value and type)
    if (left === right) return true;

    // Numeric comparison with type coercion (e.g., 3 == "3")
    const leftNum = this.toNumber(left);
    const rightNum = this.toNumber(right);
    if (leftNum !== null && rightNum !== null) {
      return leftNum === rightNum;
    }

    // String comparison (case-sensitive)
    if (typeof left === 'string' && typeof right === 'string') {
      return left === right;
    }

    // Incompatible types - not equal
    return false;
  }

  /**
   * GREATER THAN
   * Performs numeric greater than comparison
   * 
   * Process:
   * 1. Convert both values to numbers
   * 2. Validate both conversions succeeded
   * 3. Perform numeric comparison
   * 
   * Examples:
   * - greaterThan(25, 18) → true
   * - greaterThan(3.14, 3) → true
   * - greaterThan(10, 10) → false (equal, not greater)
   * - greaterThan("hello", 5) → Error (non-numeric)
   * 
   * @param left - Actual value from data (must be numeric)
   * @param right - Expected value from rule (must be numeric)
   * @returns true if left > right, false otherwise
   * @throws Error if either value cannot be converted to number
   */
  private greaterThan(left: any, right: any): boolean {
    // Attempt numeric conversion
    const leftNum = this.toNumber(left);
    const rightNum = this.toNumber(right);

    // Validate both are numeric
    if (leftNum === null || rightNum === null) {
      throw new Error('Cannot compare non-numeric values with > operator');
    }

    // Perform numeric comparison
    return leftNum > rightNum;
  }

  /**
   * LESS THAN
   * Performs numeric less than comparison
   * 
   * Process:
   * 1. Convert both values to numbers
   * 2. Validate both conversions succeeded
   * 3. Perform numeric comparison
   * 
   * Examples:
   * - lessThan(18, 25) → true
   * - lessThan(3, 3.14) → true
   * - lessThan(10, 10) → false (equal, not less)
   * - lessThan(5, "hello") → Error (non-numeric)
   * 
   * @param left - Actual value from data (must be numeric)
   * @param right - Expected value from rule (must be numeric)
   * @returns true if left < right, false otherwise
   * @throws Error if either value cannot be converted to number
   */
  private lessThan(left: any, right: any): boolean {
    // Attempt numeric conversion
    const leftNum = this.toNumber(left);
    const rightNum = this.toNumber(right);

    // Validate both are numeric
    if (leftNum === null || rightNum === null) {
      throw new Error('Cannot compare non-numeric values with < operator');
    }

    // Perform numeric comparison
    return leftNum < rightNum;
  }

  /**
   * TO NUMBER
   * Safely converts value to number, returns null if conversion fails
   * 
   * Conversion Rules:
   * - Valid numbers (number type, not NaN) → return as-is
   * - All other types → return null (no conversion attempt)
   * 
   * Design Decision:
   * Currently does NOT attempt string-to-number conversion for comparisons.
   * This prevents implicit coercion in numeric comparisons (>, <, >=, <=).
   * String-to-number coercion only happens in equals() method.
   * 
   * Examples:
   * - toNumber(25) → 25
   * - toNumber(3.14) → 3.14
   * - toNumber("25") → null (no string conversion)
   * - toNumber(NaN) → null (invalid number)
   * - toNumber(true) → null (no boolean conversion)
   * - toNumber(null) → null
   * 
   * @param val - Value to convert to number
   * @returns Number if valid, null otherwise
   */
  private toNumber(val: any): number | null {
    // Check if already a valid number
    if (typeof val === 'number' && !isNaN(val)) {
      return val;
    }
    
    // Return null for all non-numeric types
    // (No implicit conversion from string, boolean, etc.)
    return null;
  }

  /**
   * ADD DETAIL
   * Records evaluation result for a specific clause
   * 
   * Purpose:
   * Tracks which parts of the rule passed/failed for debugging and transparency.
   * Helps users understand why a rule matched or didn't match.
   * 
   * Example:
   * For rule "age > 18 AND status = 'active'" with data { age: 25, status: "active" }:
   * 
   * Details accumulated:
   * [
   *   { clause: "age > 18", result: true },
   *   { clause: "status = 'active'", result: true }
   * ]
   * 
   * Use Cases:
   * - Debugging failed rules (see which clause failed)
   * - Audit trails (track evaluation history)
   * - UI display (show clause-by-clause breakdown)
   * 
   * @param clause - Human-readable clause string (e.g., "age > 18")
   * @param result - Boolean result of clause evaluation
   */
  private addDetail(clause: string, result: boolean): void {
    this.details.push({ clause, result });
  }

  /**
   * FORMAT CLAUSE
   * Converts BinaryExpression AST node back to human-readable string
   * 
   * Format: "<field> <operator> <value>"
   * 
   * Process:
   * 1. Extract field name from left side (Identifier)
   * 2. Extract operator symbol (=, !=, >, <, >=, <=)
   * 3. Extract and format value from right side:
   *    - NumberLiteral: Use original token literal (preserves format)
   *    - StringLiteral: Wrap in single quotes
   * 4. Combine into readable string
   * 
   * Examples:
   * BinaryExpression(Identifier("age"), ">", NumberLiteral(18))
   * → "age > 18"
   * 
   * BinaryExpression(Identifier("status"), "=", StringLiteral("active"))
   * → "status = 'active'"
   * 
   * BinaryExpression(Identifier("score"), ">=", NumberLiteral(85.5))
   * → "score >= 85.5"
   * 
   * Purpose:
   * Used in details array to show original rule syntax for each clause.
   * Helps users correlate evaluation results back to original rule.
   * 
   * @param expr - BinaryExpression AST node
   * @returns Human-readable clause string
   */
  private formatClause(expr: BinaryExpression): string {
    // Extract field name (left side)
    const left = expr.left instanceof Identifier ? expr.left.value : '';
    
    // Extract operator symbol
    const operator = expr.operator.literal;
    
    // Extract and format value (right side)
    let right = '';
    if (expr.right instanceof NumberLiteral) {
      // Use original token literal (preserves decimal format)
      right = expr.right.token.literal;
    } else if (expr.right instanceof StringLiteral) {
      // Wrap string value in quotes
      right = `'${expr.right.value}'`;
    }

    // Combine into readable format: "field operator value"
    return `${left} ${operator} ${right}`;
  }
}
