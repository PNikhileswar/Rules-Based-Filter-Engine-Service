/**
 * LEXER: Tokenizes Expression Strings
 * 
 * The lexer performs lexical analysis (tokenization) by reading
 * a string character-by-character and grouping characters into tokens.
 * 
 * Example:
 * Input:  "age >= 18 AND country = 'US'"
 * Output: [IDENTIFIER(age), GREATER_EQUAL(>=), NUMBER(18), AND, 
 *          IDENTIFIER(country), EQUAL(=), STRING(US)]
 * 
 * This is the first step in the parsing pipeline:
 * Lexer → Parser → AST → Evaluator
 */

import { Token, TokenType } from '../domain/token';

export class Lexer {
  private position = 0;       // Current position in input (current char)
  private readPosition = 0;   // Next reading position (after current char)
  private ch: string | null = null;  // Current character under examination

  /**
   * Constructor
   * @param input - Expression string to tokenize
   * 
   * Initializes by reading the first character
   */
  constructor(private input: string) {
    this.readChar(); // Start by reading first character
  }

  /**
   * READ CHAR
   * Advances position and reads next character from input
   * Sets ch to null when reaching end of input
   * 
   * Example progression for "age":
   * Step 1: position=0, ch='a'
   * Step 2: position=1, ch='g'
   * Step 3: position=2, ch='e'
   * Step 4: position=3, ch=null (EOF)
   */
  private readChar(): void {
    if (this.readPosition >= this.input.length) {
      this.ch = null; // End of input
    } else {
      this.ch = this.input[this.readPosition];
    }
    this.position = this.readPosition;
    this.readPosition++;
  }

  /**
   * PEEK CHAR
   * Looks at next character without advancing position
   * Used to identify multi-character operators like '>=' or '!='
   * 
   * Example: When ch='>', peek to see if next is '=' to form '>='
   * 
   * @returns Next character or null if at end
   */
  private peekChar(): string | null {
    if (this.readPosition >= this.input.length) {
      return null;
    }
    return this.input[this.readPosition];
  }

  nextToken(): Token {
    let tok: Token;

    this.skipWhitespace();

    const pos = this.position;

    switch (this.ch) {
      case '=':
        tok = { type: TokenType.EQUAL, literal: this.ch, position: pos };
        break;
      case '!':
        if (this.peekChar() === '=') {
          const ch = this.ch;
          this.readChar();
          tok = {
            type: TokenType.NOT_EQUAL,
            literal: ch + this.ch,
            position: pos,
          };
        } else {
          tok = { type: TokenType.ILLEGAL, literal: this.ch, position: pos };
        }
        break;
      case '>':
        if (this.peekChar() === '=') {
          const ch = this.ch;
          this.readChar();
          tok = {
            type: TokenType.GREATER_EQUAL,
            literal: ch + this.ch,
            position: pos,
          };
        } else {
          tok = { type: TokenType.GREATER, literal: this.ch, position: pos };
        }
        break;
      case '<':
        if (this.peekChar() === '=') {
          const ch = this.ch;
          this.readChar();
          tok = {
            type: TokenType.LESS_EQUAL,
            literal: ch + this.ch,
            position: pos,
          };
        } else {
          tok = { type: TokenType.LESS, literal: this.ch, position: pos };
        }
        break;
      case '(':
        tok = { type: TokenType.LEFT_PAREN, literal: this.ch, position: pos };
        break;
      case ')':
        tok = { type: TokenType.RIGHT_PAREN, literal: this.ch, position: pos };
        break;
      case "'":
        const str = this.readString();
        tok = { type: TokenType.STRING, literal: str, position: pos };
        this.readChar();
        return tok;
      case null:
        tok = { type: TokenType.EOF, literal: '', position: pos };
        break;
      default:
        if (this.isLetter(this.ch)) {
          const literal = this.readIdentifier();
          const type = this.lookupIdent(literal);
          return { type, literal, position: pos };
        } else if (this.isDigit(this.ch)) {
          const literal = this.readNumber();
          return { type: TokenType.NUMBER, literal, position: pos };
        } else {
          tok = { type: TokenType.ILLEGAL, literal: this.ch, position: pos };
        }
    }

    this.readChar();
    return tok;
  }

  /**
   * SKIP WHITESPACE
   * Advances position past all whitespace characters
   * Whitespace is ignored in expressions: "age  >=  18" same as "age>=18"
   */
  private skipWhitespace(): void {
    while (
      this.ch === ' ' ||  // Space
      this.ch === '\t' || // Tab
      this.ch === '\n' || // Newline
      this.ch === '\r'    // Carriage return
    ) {
      this.readChar();
    }
  }

  /**
   * READ IDENTIFIER
   * Reads a complete identifier or keyword (age, country, status, AND, OR)
   * Continues reading while current char is letter, digit, or underscore
   * 
   * Example: "age_limit" → reads all characters until space or operator
   * 
   * @returns The complete identifier string
   */
  private readIdentifier(): string {
    const position = this.position;
    // Read while letter, digit, or underscore (allows user_id, age_2, etc.)
    while (this.ch && (this.isLetter(this.ch) || this.isDigit(this.ch) || this.ch === '_')) {
      this.readChar();
    }
    return this.input.slice(position, this.position);
  }

  /**
   * READ NUMBER
   * Reads integer or decimal number (18, 99.99, 0.5)
   * Supports decimal points followed by digits
   * 
   * Examples:
   * - "18" → "18"
   * - "99.99" → "99.99"
   * - "0.5" → "0.5"
   * 
   * @returns The complete number string
   */
  private readNumber(): string {
    const position = this.position;
    // Read integer part
    while (this.ch && this.isDigit(this.ch)) {
      this.readChar();
    }
    // Handle decimal numbers (e.g., 99.99)
    if (this.ch === '.' && this.peekChar() && this.isDigit(this.peekChar()!)) {
      this.readChar(); // Consume '.'
      // Read decimal part
      while (this.ch && this.isDigit(this.ch)) {
        this.readChar();
      }
    }
    return this.input.slice(position, this.position);
  }

  /**
   * READ STRING
   * Reads string literal enclosed in single quotes
   * Example: 'US' → US (without quotes)
   * 
   * String must be enclosed in single quotes: 'value'
   * Reads until closing quote or end of input
   * 
   * @returns String content without quotes
   */
  private readString(): string {
    const position = this.position + 1; // Skip opening quote
    while (true) {
      this.readChar();
      if (this.ch === "'" || this.ch === null) {
        break; // Stop at closing quote or end of input
      }
    }
    return this.input.slice(position, this.position);
  }

  /**
   * IS LETTER
   * Checks if character is a letter (a-z, A-Z)
   * Used to identify start of identifier or keyword
   * 
   * @param ch - Character to check
   * @returns true if letter, false otherwise
   */
  private isLetter(ch: string): boolean {
    return /[a-zA-Z]/.test(ch);
  }

  /**
   * IS DIGIT
   * Checks if character is a digit (0-9)
   * Used to identify numbers
   * 
   * @param ch - Character to check
   * @returns true if digit, false otherwise
   */
  private isDigit(ch: string): boolean {
    return /[0-9]/.test(ch);
  }

  /**
   * LOOKUP IDENT
   * Determines if identifier is a keyword (AND, OR) or regular identifier
   * 
   * Keywords are case-sensitive:
   * - "AND" → TokenType.AND
   * - "OR" → TokenType.OR
   * - "age" → TokenType.IDENTIFIER
   * 
   * @param ident - Identifier string to look up
   * @returns Token type (keyword or IDENTIFIER)
   */
  private lookupIdent(ident: string): TokenType {
    const keywords: Record<string, TokenType> = {
      AND: TokenType.AND,
      OR: TokenType.OR,
    };
    // Return keyword type if found, otherwise IDENTIFIER
    return keywords[ident] || TokenType.IDENTIFIER;
  }
}
