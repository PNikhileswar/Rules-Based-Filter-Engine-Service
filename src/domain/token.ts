// Token types for lexical analysis

export enum TokenType {
  // Special
  EOF = 'EOF',
  ILLEGAL = 'ILLEGAL',

  // Literals and identifiers
  IDENTIFIER = 'IDENTIFIER',
  NUMBER = 'NUMBER',
  STRING = 'STRING',

  // Comparison operators
  EQUAL = '=',
  NOT_EQUAL = '!=',
  GREATER = '>',
  LESS = '<',
  GREATER_EQUAL = '>=',
  LESS_EQUAL = '<=',

  // Logical operators
  AND = 'AND',
  OR = 'OR',

  // Delimiters
  LEFT_PAREN = '(',
  RIGHT_PAREN = ')',
}

export interface Token {
  type: TokenType;
  literal: string;
  position: number;
}
