/**
 * TOKEN TYPES FOR LEXICAL ANALYSIS
 * 
 * Defines all possible token types that the lexer can produce.
 * Tokens are the building blocks of expressions - like words in a sentence.
 * 
 * The lexer breaks down "age >= 18 AND country = 'US'" into:
 * [IDENTIFIER, GREATER_EQUAL, NUMBER, AND, IDENTIFIER, EQUAL, STRING]
 */

/**
 * TOKEN TYPE ENUMERATION
 * All possible types of tokens in our expression language
 * 
 * Categories:
 * 1. Special: EOF (end of file), ILLEGAL (invalid character)
 * 2. Literals: Numbers (18, 99.99), Strings ('US'), Identifiers (age, country)
 * 3. Operators: Comparison (=, !=, >, <, >=, <=) and Logical (AND, OR)
 * 4. Delimiters: Parentheses for grouping expressions
 */
export enum TokenType {
  // ===== SPECIAL TOKENS =====
  
  /** End of input - signals parser to stop */
  EOF = 'EOF',
  
  /** Illegal/unrecognized character - triggers error */
  ILLEGAL = 'ILLEGAL',

  // ===== LITERALS AND IDENTIFIERS =====
  
  /** Variable name (e.g., age, country, user_id) */
  IDENTIFIER = 'IDENTIFIER',
  
  /** Numeric value (e.g., 18, 99.99, 0.5) */
  NUMBER = 'NUMBER',
  
  /** String value enclosed in quotes (e.g., 'US', 'active') */
  STRING = 'STRING',

  // ===== COMPARISON OPERATORS =====
  
  /** Equality operator: age = 18 */
  EQUAL = '=',
  
  /** Inequality operator: status != 'banned' */
  NOT_EQUAL = '!=',
  
  /** Greater than operator: age > 18 */
  GREATER = '>',
  
  /** Less than operator: score < 100 */
  LESS = '<',
  
  /** Greater than or equal operator: age >= 18 */
  GREATER_EQUAL = '>=',
  
  /** Less than or equal operator: score <= 100 */
  LESS_EQUAL = '<=',

  // ===== LOGICAL OPERATORS =====
  
  /** Logical AND: both conditions must be true */
  AND = 'AND',
  
  /** Logical OR: at least one condition must be true */
  OR = 'OR',

  // ===== DELIMITERS =====
  
  /** Opening parenthesis for grouping: (age > 18 AND ...) */
  LEFT_PAREN = '(',
  
  /** Closing parenthesis */
  RIGHT_PAREN = ')',
}

/**
 * TOKEN INTERFACE
 * Represents a single token with its type, value, and position
 * 
 * Position tracking enables precise error messages:
 * "Unexpected token '>' at position 15" instead of just "Syntax error"
 * 
 * Example:
 * {
 *   type: TokenType.GREATER_EQUAL,
 *   literal: ">=",
 *   position: 4
 * }
 * From expression "age >= 18", position 4 is where '>=' starts
 */
export interface Token {
  /** Type of token (what category it belongs to) */
  type: TokenType;
  
  /** Actual text from input (e.g., ">=", "age", "18", "'US'") */
  literal: string;
  
  /** Character position in original input (for error reporting) */
  position: number;
}
