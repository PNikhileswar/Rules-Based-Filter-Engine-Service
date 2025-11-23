// Lexer: Tokenizes expression strings

import { Token, TokenType } from '../domain/token';

export class Lexer {
  private position = 0;
  private readPosition = 0;
  private ch: string | null = null;

  constructor(private input: string) {
    this.readChar();
  }

  private readChar(): void {
    if (this.readPosition >= this.input.length) {
      this.ch = null;
    } else {
      this.ch = this.input[this.readPosition];
    }
    this.position = this.readPosition;
    this.readPosition++;
  }

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

  private skipWhitespace(): void {
    while (
      this.ch === ' ' ||
      this.ch === '\t' ||
      this.ch === '\n' ||
      this.ch === '\r'
    ) {
      this.readChar();
    }
  }

  private readIdentifier(): string {
    const position = this.position;
    while (this.ch && (this.isLetter(this.ch) || this.isDigit(this.ch) || this.ch === '_')) {
      this.readChar();
    }
    return this.input.slice(position, this.position);
  }

  private readNumber(): string {
    const position = this.position;
    while (this.ch && this.isDigit(this.ch)) {
      this.readChar();
    }
    // Handle decimal numbers
    if (this.ch === '.' && this.peekChar() && this.isDigit(this.peekChar()!)) {
      this.readChar();
      while (this.ch && this.isDigit(this.ch)) {
        this.readChar();
      }
    }
    return this.input.slice(position, this.position);
  }

  private readString(): string {
    const position = this.position + 1; // Skip opening quote
    while (true) {
      this.readChar();
      if (this.ch === "'" || this.ch === null) {
        break;
      }
    }
    return this.input.slice(position, this.position);
  }

  private isLetter(ch: string): boolean {
    return /[a-zA-Z]/.test(ch);
  }

  private isDigit(ch: string): boolean {
    return /[0-9]/.test(ch);
  }

  private lookupIdent(ident: string): TokenType {
    const keywords: Record<string, TokenType> = {
      AND: TokenType.AND,
      OR: TokenType.OR,
    };
    return keywords[ident] || TokenType.IDENTIFIER;
  }
}
