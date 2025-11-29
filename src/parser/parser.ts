/**
 * PARSER: Builds Abstract Syntax Tree from Tokens
 * 
 * The parser takes tokens from the lexer and builds an Abstract Syntax Tree (AST).
 * Uses Pratt Parsing algorithm (Top-Down Operator Precedence) to handle
 * operator precedence elegantly.
 * 
 * Pipeline:
 * Lexer → Tokens → Parser → AST → Evaluator
 * 
 * Example:
 * Input tokens: [IDENTIFIER(age), GREATER_EQUAL(>=), NUMBER(18), AND, ...]
 * Output AST:
 *         LogicalExpression(AND)
 *            /              \
 *    BinaryExpression    BinaryExpression
 *     (age >= 18)       (country = 'US')
 * 
 * Why Pratt Parsing?
 * - Handles operator precedence naturally
 * - Easy to extend with new operators
 * - Compact code compared to recursive descent
 * - Used in many production parsers (Go, V8 JavaScript engine)
 */

import { Token, TokenType } from '../domain/token';
import {
  Expression,
  BinaryExpression,
  LogicalExpression,
  Identifier,
  NumberLiteral,
  StringLiteral,
} from '../domain/ast';
import { Lexer } from './lexer';

/**
 * OPERATOR PRECEDENCE LEVELS
 * Determines which operators bind more tightly
 * 
 * Higher number = higher precedence = evaluated first
 * 
 * Example: "age > 18 AND likes > 100 OR status = 'active'"
 * - COMPARE (3): age > 18, likes > 100, status = 'active' evaluated first
 * - LOGICAL (2): AND evaluated before OR
 * 
 * Result tree:
 *            OR (precedence 2)
 *          /    \
 *        AND     status='active'
 *       /   \
 *    age>18  likes>100
 * 
 * This matches mathematical convention: comparison before logical operations
 */
enum Precedence {
  LOWEST = 1,     // Default precedence
  LOGICAL = 2,    // AND, OR
  COMPARE = 3,    // =, !=, >, <, >=, <=
}

/**
 * PRECEDENCE MAP
 * Maps each operator token type to its precedence level
 * Used by parser to decide when to recurse
 */
const precedences: Record<TokenType, Precedence> = {
  // Logical operators (lower precedence)
  [TokenType.OR]: Precedence.LOGICAL,
  [TokenType.AND]: Precedence.LOGICAL,
  
  // Comparison operators (higher precedence)
  [TokenType.EQUAL]: Precedence.COMPARE,
  [TokenType.NOT_EQUAL]: Precedence.COMPARE,
  [TokenType.GREATER]: Precedence.COMPARE,
  [TokenType.LESS]: Precedence.COMPARE,
  [TokenType.GREATER_EQUAL]: Precedence.COMPARE,
  [TokenType.LESS_EQUAL]: Precedence.COMPARE,
} as Record<TokenType, Precedence>;

/**
 * PARSER CLASS
 * Converts token stream into Abstract Syntax Tree
 * 
 * Uses two-token lookahead:
 * - curToken: Current token being processed
 * - peekToken: Next token (for operator precedence decisions)
 */
export class Parser {
  /** Current token being examined */
  private curToken!: Token;
  
  /** Next token (lookahead for precedence) */
  private peekToken!: Token;
  
  /** Accumulated parsing errors */
  private errors: string[] = [];

  /**
   * Constructor
   * Initializes parser with lexer and reads first two tokens
   * 
   * @param lexer - Lexer instance that provides tokens
   */
  constructor(private lexer: Lexer) {
    // Read first token into peekToken
    this.nextToken();
    // Read second token, moving first to curToken
    this.nextToken();
    // Now: curToken = first token, peekToken = second token
  }

  /**
   * NEXT TOKEN
   * Advances the parser by one token
   * Shifts peekToken to curToken and reads new peekToken from lexer
   * 
   * Like sliding a window across the token stream:
   * [token1] [token2] [token3] ...
   *  ^cur     ^peek
   * After nextToken():
   *         [token2] [token3] ...
   *          ^cur     ^peek
   */
  private nextToken(): void {
    this.curToken = this.peekToken;
    this.peekToken = this.lexer.nextToken();
  }

  /**
   * PARSE
   * Main entry point - parses complete expression and returns AST
   * 
   * Process:
   * 1. Parse expression with lowest precedence (allows all operators)
   * 2. Check for any parsing errors
   * 3. Verify we consumed all tokens (reached EOF)
   * 4. Return AST root node
   * 
   * @returns Root expression node of the AST
   * @throws Error if syntax is invalid or unexpected tokens remain
   */
  parse(): Expression {
    // Parse the expression starting with lowest precedence
    // This allows any operator to be parsed
    const expr = this.parseExpression(Precedence.LOWEST);

    // Check if any errors occurred during parsing
    if (this.errors.length > 0) {
      throw new Error(`Parsing error at position ${this.curToken.position}: ${this.errors[0]}`);
    }

    // Advance to EOF if we're at the last token
    if (this.peekToken.type === TokenType.EOF && this.curToken.type !== TokenType.EOF) {
      this.nextToken();
    }

    // Verify we consumed the entire expression (no trailing tokens)
    if (this.curToken.type !== TokenType.EOF) {
      throw new Error(
        `Unexpected token '${this.curToken.literal}' at position ${this.curToken.position}. Expected end of expression.`
      );
    }

    return expr;
  }

  /**
   * PARSE EXPRESSION (Pratt Parser Core)
   * Recursively parses expressions respecting operator precedence
   * 
   * Pratt Parsing Algorithm:
   * 1. Parse left-hand side (primary expression)
   * 2. While next operator has higher precedence:
   *    - Consume operator
   *    - Parse right-hand side recursively
   *    - Build binary/logical expression
   * 3. Return complete expression tree
   * 
   * Example: "age > 18 AND status = 'active'"
   * 1. Parse "age > 18" as left (precedence COMPARE)
   * 2. See AND (precedence LOGICAL < COMPARE), continue
   * 3. Parse "status = 'active'" as right
   * 4. Build LogicalExpression(AND, left, right)
   * 
   * @param precedence - Minimum precedence to bind operators
   * @returns Expression tree node
   */
  private parseExpression(precedence: Precedence): Expression {
    // Parse left-hand side (identifier, number, string, or grouped expression)
    let left = this.parsePrimary();

    // Build expression tree by consuming operators with higher precedence
    // Stop when we hit EOF or an operator with lower/equal precedence
    while (
      this.peekToken.type !== TokenType.EOF &&
      precedence < this.peekPrecedence()
    ) {
      this.nextToken(); // Consume the operator
      left = this.parseInfixExpression(left); // Build binary/logical node
      if (!left) {
        throw new Error('Failed to parse infix expression');
      }
    }

    return left;
  }

  /**
   * PARSE PRIMARY
   * Parses atomic expressions (leaf nodes of the AST)
   * 
   * Handles four types of primary expressions:
   * 1. IDENTIFIER - Variable name (e.g., "age", "status")
   * 2. NUMBER - Numeric literal (e.g., "18", "3.14")
   * 3. STRING - String literal (e.g., "'active'", "'John'")
   * 4. LEFT_PAREN - Grouped expression (e.g., "(age > 18)")
   * 
   * Examples:
   * - "age" → Identifier("age")
   * - "18" → NumberLiteral(18)
   * - "'active'" → StringLiteral("active")
   * - "(age > 18)" → Calls parseGroupedExpression()
   * 
   * @returns Leaf expression node (Identifier, NumberLiteral, StringLiteral, or grouped)
   * @throws Error if token type is invalid for primary expression
   */
  private parsePrimary(): Expression {
    switch (this.curToken.type) {
      case TokenType.IDENTIFIER:
        // Create identifier node (represents a field name in data)
        const ident = new Identifier(this.curToken, this.curToken.literal);
        return ident;
      case TokenType.NUMBER:
        // Parse numeric literal
        return this.parseNumberLiteral();
      case TokenType.STRING:
        // Create string literal node (quotes already stripped by lexer)
        const str = new StringLiteral(this.curToken, this.curToken.literal);
        return str;
      case TokenType.LEFT_PAREN:
        // Parse parenthesized expression for precedence override
        return this.parseGroupedExpression();
      default:
        // Invalid token for primary expression
        const errorMsg = `Unexpected token '${this.curToken.literal}' at position ${this.curToken.position}`;
        this.addError(errorMsg);
        throw new Error(errorMsg);
    }
  }

  /**
   * PARSE NUMBER LITERAL
   * Converts token string to numeric value and creates NumberLiteral node
   * 
   * Process:
   * 1. Convert string to float using parseFloat
   * 2. Validate result is not NaN
   * 3. Create NumberLiteral AST node
   * 
   * Examples:
   * - "18" → NumberLiteral(18)
   * - "3.14" → NumberLiteral(3.14)
   * - "abc" → Error (not a valid number)
   * 
   * @returns NumberLiteral node with parsed numeric value
   * @throws Error if token cannot be parsed as valid number
   */
  private parseNumberLiteral(): Expression {
    // Convert token string to JavaScript number
    const value = parseFloat(this.curToken.literal);
    
    // Validate conversion succeeded
    if (isNaN(value)) {
      const errorMsg = `Could not parse '${this.curToken.literal}' as number at position ${this.curToken.position}`;
      this.addError(errorMsg);
      throw new Error(errorMsg);
    }
    
    // Create NumberLiteral AST node
    return new NumberLiteral(this.curToken, value);
  }

  /**
   * PARSE GROUPED EXPRESSION
   * Handles parenthesized expressions for precedence override
   * 
   * Process:
   * 1. Skip opening LEFT_PAREN (already current token)
   * 2. Parse inner expression with LOWEST precedence
   * 3. Expect closing RIGHT_PAREN
   * 4. Consume RIGHT_PAREN and return inner expression
   * 
   * Example: "(age > 18 OR status = 'active')"
   * 1. Current: LEFT_PAREN
   * 2. nextToken() → move to "age"
   * 3. parseExpression(LOWEST) → parses entire "age > 18 OR status = 'active'"
   * 4. Verify closing paren and return inner expression
   * 
   * Precedence override: Without parens, "age > 18 OR status = 'active' AND verified = true"
   * would bind as "age > 18 OR (status = 'active' AND verified = true)"
   * With parens: "(age > 18 OR status = 'active') AND verified = true"
   * 
   * @returns Inner expression (parens are not represented in AST)
   * @throws Error if closing parenthesis is missing
   */
  private parseGroupedExpression(): Expression {
    // Skip opening LEFT_PAREN
    this.nextToken();
    
    // Parse entire expression inside parens with lowest precedence
    // This allows any operators to be parsed within the group
    const exp = this.parseExpression(Precedence.LOWEST);

    // Verify closing RIGHT_PAREN exists
    if (this.peekToken.type !== TokenType.RIGHT_PAREN) {
      const errorMsg = `Expected closing parenthesis ')' at position ${this.peekToken.position}`;
      this.addError(errorMsg);
      throw new Error(errorMsg);
    }

    // Consume RIGHT_PAREN
    this.nextToken();
    
    // Return inner expression (parens are discarded, only used for precedence)
    return exp;
  }

  /**
   * PARSE INFIX EXPRESSION
   * Builds binary or logical expression node with operator and operands
   * 
   * Handles two categories:
   * 1. Logical operators (AND, OR) → LogicalExpression
   * 2. Comparison operators (=, !=, >, <, >=, <=) → BinaryExpression
   * 
   * Process:
   * 1. Get operator precedence
   * 2. Consume next token (move to right operand)
   * 3. Recursively parse right side with operator precedence
   * 4. Build appropriate expression node
   * 
   * Example: "age > 18"
   * - left: Identifier("age")
   * - operator: > (GREATER_THAN)
   * - right: NumberLiteral(18)
   * - result: BinaryExpression(left, >, right)
   * 
   * Example: "status = 'active' AND age > 18"
   * - left: BinaryExpression(status = 'active')
   * - operator: AND
   * - right: BinaryExpression(age > 18)
   * - result: LogicalExpression(left, AND, right)
   * 
   * @param left - Left operand expression (already parsed)
   * @returns BinaryExpression or LogicalExpression combining left, operator, right
   */
  private parseInfixExpression(left: Expression): Expression {
    const operator = this.curToken; // Current token is the operator

    // Handle logical operators (AND, OR)
    if (operator.type === TokenType.AND || operator.type === TokenType.OR) {
      const precedence = this.curPrecedence();
      this.nextToken(); // Move to right operand
      const right = this.parseExpression(precedence); // Parse right side recursively
      return new LogicalExpression(left, operator, right);
    }

    // Handle comparison operators (=, !=, >, <, >=, <=)
    const precedence = this.curPrecedence();
    this.nextToken(); // Move to right operand
    const right = this.parseExpression(precedence); // Parse right side recursively
    return new BinaryExpression(left, operator, right);
  }

  /**
   * PEEK PRECEDENCE
   * Returns precedence of the next token (lookahead)
   * 
   * Used to decide whether to continue parsing in current expression
   * or return control to caller.
   * 
   * Example: Parsing "age > 18 AND status = 'active'"
   * When at "18", peekPrecedence() returns precedence of AND
   * to decide if we should continue or return the "age > 18" expression
   * 
   * @returns Precedence value of peekToken, or LOWEST if not an operator
   */
  private peekPrecedence(): Precedence {
    return precedences[this.peekToken.type] || Precedence.LOWEST;
  }

  /**
   * CURRENT PRECEDENCE
   * Returns precedence of the current token (operator)
   * 
   * Used when building infix expressions to determine how tightly
   * to bind the right operand.
   * 
   * Example: "age > 18"
   * When current token is ">", returns Precedence.COMPARE (3)
   * 
   * @returns Precedence value of curToken, or LOWEST if not an operator
   */
  private curPrecedence(): Precedence {
    return precedences[this.curToken.type] || Precedence.LOWEST;
  }

  /**
   * ADD ERROR
   * Accumulates parsing error messages
   * 
   * Errors are collected rather than thrown immediately to provide
   * better error reporting (could report multiple errors in future).
   * 
   * @param msg - Error message describing what went wrong
   */
  private addError(msg: string): void {
    this.errors.push(msg);
  }

  /**
   * GET ERRORS
   * Returns all accumulated parsing errors
   * 
   * Used for debugging or providing detailed error messages to caller.
   * 
   * @returns Array of error message strings
   */
  getErrors(): string[] {
    return this.errors;
  }
}

/**
 * PARSE EXPRESSION (Factory Function)
 * Convenience function to parse rule expression string into AST
 * 
 * Encapsulates the two-step process:
 * 1. Create Lexer to tokenize the expression string
 * 2. Create Parser to build AST from tokens
 * 
 * Example:
 * parseExpression("age > 18 AND status = 'active'")
 * → LogicalExpression(
 *     BinaryExpression(Identifier("age"), ">", NumberLiteral(18)),
 *     "AND",
 *     BinaryExpression(Identifier("status"), "=", StringLiteral("active"))
 *   )
 * 
 * @param expression - Rule expression string to parse
 * @returns Root node of Abstract Syntax Tree
 * @throws Error if expression has syntax errors
 */
export function parseExpression(expression: string): Expression {
  // Step 1: Tokenize the expression string
  const lexer = new Lexer(expression);
  
  // Step 2: Build AST from token stream
  const parser = new Parser(lexer);
  
  // Step 3: Parse and return AST root node
  return parser.parse();
}
