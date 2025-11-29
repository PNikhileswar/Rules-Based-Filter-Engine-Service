/**
 * ABSTRACT SYNTAX TREE (AST) NODE DEFINITIONS
 * 
 * AST is a tree representation of the syntactic structure of an expression.
 * Each node represents a construct in the expression.
 * 
 * Example expression: "age >= 18 AND country = 'US'"
 * 
 * AST Tree:
 *           LogicalExpression (AND)
 *              /              \
 *      BinaryExpression    BinaryExpression
 *       (age >= 18)        (country = 'US')
 *        /   |   \           /    |    \
 *    Ident  >=  Number    Ident  =  String
 *    (age)     (18)      (country)  ('US')
 * 
 * This tree structure makes evaluation straightforward:
 * - Traverse the tree recursively
 * - Evaluate each node
 * - Combine results based on operators
 */

import { Token } from './token';

/**
 * AST NODE BASE INTERFACE
 * All AST nodes must implement this interface
 * Provides common method for getting node's token literal
 */
export interface ASTNode {
  /** Returns the literal value of the node's token */
  tokenLiteral(): string;
}

/**
 * EXPRESSION INTERFACE
 * Represents any expression node in the AST
 * All expression types (binary, logical, literals) implement this
 */
export interface Expression extends ASTNode {
  /** Marker method to identify expression nodes (vs statement nodes) */
  expressionNode(): void;
}

/**
 * BINARY EXPRESSION
 * Represents comparison operations: age >= 18, country = 'US', score < 100
 * 
 * Structure:
 * - left: Identifier (the field name, e.g., 'age')
 * - operator: Comparison token (=, !=, >, <, >=, <=)
 * - right: Literal value (NumberLiteral or StringLiteral)
 * 
 * Example: age >= 18
 * - left: Identifier("age")
 * - operator: Token(GREATER_EQUAL, ">=")
 * - right: NumberLiteral(18)
 */
export class BinaryExpression implements Expression {
  /**
   * Constructor
   * @param left - Left side expression (usually Identifier)
   * @param operator - Comparison operator token
   * @param right - Right side expression (usually Literal)
   */
  constructor(
    public left: Expression,
    public operator: Token,
    public right: Expression
  ) {}

  /** Marker method for expression nodes */
  expressionNode(): void {}
  
  /** Returns the operator symbol (e.g., ">=", "=") */
  tokenLiteral(): string {
    return this.operator.literal;
  }
}

/**
 * LOGICAL EXPRESSION
 * Represents logical operations: AND, OR
 * Combines two expressions with logical operator
 * 
 * Structure:
 * - left: Expression (can be Binary or another Logical)
 * - operator: Logical token (AND, OR)
 * - right: Expression (can be Binary or another Logical)
 * 
 * Example: age >= 18 AND country = 'US'
 * - left: BinaryExpression(age >= 18)
 * - operator: Token(AND, "AND")
 * - right: BinaryExpression(country = 'US')
 * 
 * Supports nesting: (age >= 18 AND status = 'active') OR role = 'admin'
 */
export class LogicalExpression implements Expression {
  /**
   * Constructor
   * @param left - Left side expression
   * @param operator - Logical operator (AND/OR)
   * @param right - Right side expression
   */
  constructor(
    public left: Expression,
    public operator: Token,
    public right: Expression
  ) {}

  /** Marker method for expression nodes */
  expressionNode(): void {}
  
  /** Returns the operator (e.g., "AND", "OR") */
  tokenLiteral(): string {
    return this.operator.literal;
  }
}

/**
 * IDENTIFIER
 * Represents a variable/field name in the expression
 * 
 * Examples: age, country, user_id, status
 * 
 * During evaluation, the identifier's value is looked up in the data object:
 * - Identifier("age") → data["age"] → 25
 * - Identifier("country") → data["country"] → "US"
 */
export class Identifier implements Expression {
  /**
   * Constructor
   * @param token - The identifier token
   * @param value - The identifier string (e.g., "age", "country")
   */
  constructor(public token: Token, public value: string) {}

  /** Marker method for expression nodes */
  expressionNode(): void {}
  
  /** Returns the identifier name */
  tokenLiteral(): string {
    return this.token.literal;
  }
}

/**
 * NUMBER LITERAL
 * Represents a numeric constant in the expression
 * 
 * Examples: 18, 99.99, 0.5, -10
 * 
 * Supports both integers and decimals
 * Used in comparisons: age >= 18, price <= 99.99
 */
export class NumberLiteral implements Expression {
  /**
   * Constructor
   * @param token - The number token
   * @param value - The numeric value (parsed from token literal)
   */
  constructor(public token: Token, public value: number) {}

  /** Marker method for expression nodes */
  expressionNode(): void {}
  
  /** Returns the number as string (e.g., "18", "99.99") */
  tokenLiteral(): string {
    return this.token.literal;
  }
}

/**
 * STRING LITERAL
 * Represents a string constant in the expression
 * Must be enclosed in single quotes in the expression
 * 
 * Examples: 'US', 'active', 'John Doe'
 * 
 * Used in string comparisons: country = 'US', status != 'banned'
 * 
 * Note: Quotes are removed during parsing, only the content is stored
 * Expression: country = 'US' → StringLiteral with value "US" (no quotes)
 */
export class StringLiteral implements Expression {
  /**
   * Constructor
   * @param token - The string token
   * @param value - The string value WITHOUT quotes
   */
  constructor(public token: Token, public value: string) {}

  /** Marker method for expression nodes */
  expressionNode(): void {}
  
  /** Returns the string value */
  tokenLiteral(): string {
    return this.token.literal;
  }
}
