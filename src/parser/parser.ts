// Parser: Builds Abstract Syntax Tree from tokens

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

enum Precedence {
  LOWEST = 1,
  LOGICAL = 2,
  COMPARE = 3,
}

const precedences: Record<TokenType, Precedence> = {
  [TokenType.OR]: Precedence.LOGICAL,
  [TokenType.AND]: Precedence.LOGICAL,
  [TokenType.EQUAL]: Precedence.COMPARE,
  [TokenType.NOT_EQUAL]: Precedence.COMPARE,
  [TokenType.GREATER]: Precedence.COMPARE,
  [TokenType.LESS]: Precedence.COMPARE,
  [TokenType.GREATER_EQUAL]: Precedence.COMPARE,
  [TokenType.LESS_EQUAL]: Precedence.COMPARE,
} as Record<TokenType, Precedence>;

export class Parser {
  private curToken!: Token;
  private peekToken!: Token;
  private errors: string[] = [];

  constructor(private lexer: Lexer) {
    this.nextToken();
    this.nextToken();
  }

  private nextToken(): void {
    this.curToken = this.peekToken;
    this.peekToken = this.lexer.nextToken();
  }

  parse(): Expression {
    const expr = this.parseExpression(Precedence.LOWEST);

    if (this.errors.length > 0) {
      throw new Error(`Parsing error at position ${this.curToken.position}: ${this.errors[0]}`);
    }

    // After parsing expression, advance once more if needed
    if (this.peekToken.type === TokenType.EOF && this.curToken.type !== TokenType.EOF) {
      this.nextToken();
    }

    if (this.curToken.type !== TokenType.EOF) {
      throw new Error(
        `Unexpected token '${this.curToken.literal}' at position ${this.curToken.position}. Expected end of expression.`
      );
    }

    return expr;
  }

  private parseExpression(precedence: Precedence): Expression {
    let left = this.parsePrimary();

    while (
      this.peekToken.type !== TokenType.EOF &&
      precedence < this.peekPrecedence()
    ) {
      this.nextToken();
      left = this.parseInfixExpression(left);
      if (!left) {
        throw new Error('Failed to parse infix expression');
      }
    }

    return left;
  }

  private parsePrimary(): Expression {
    switch (this.curToken.type) {
      case TokenType.IDENTIFIER:
        const ident = new Identifier(this.curToken, this.curToken.literal);
        return ident;
      case TokenType.NUMBER:
        return this.parseNumberLiteral();
      case TokenType.STRING:
        const str = new StringLiteral(this.curToken, this.curToken.literal);
        return str;
      case TokenType.LEFT_PAREN:
        return this.parseGroupedExpression();
      default:
        const errorMsg = `Unexpected token '${this.curToken.literal}' at position ${this.curToken.position}`;
        this.addError(errorMsg);
        throw new Error(errorMsg);
    }
  }

  private parseNumberLiteral(): Expression {
    const value = parseFloat(this.curToken.literal);
    if (isNaN(value)) {
      const errorMsg = `Could not parse '${this.curToken.literal}' as number at position ${this.curToken.position}`;
      this.addError(errorMsg);
      throw new Error(errorMsg);
    }
    return new NumberLiteral(this.curToken, value);
  }

  private parseGroupedExpression(): Expression {
    this.nextToken();
    const exp = this.parseExpression(Precedence.LOWEST);

    if (this.peekToken.type !== TokenType.RIGHT_PAREN) {
      const errorMsg = `Expected closing parenthesis ')' at position ${this.peekToken.position}`;
      this.addError(errorMsg);
      throw new Error(errorMsg);
    }

    this.nextToken();
    return exp;
  }

  private parseInfixExpression(left: Expression): Expression {
    const operator = this.curToken;

    if (operator.type === TokenType.AND || operator.type === TokenType.OR) {
      const precedence = this.curPrecedence();
      this.nextToken();
      const right = this.parseExpression(precedence);
      return new LogicalExpression(left, operator, right);
    }

    const precedence = this.curPrecedence();
    this.nextToken();
    const right = this.parseExpression(precedence);
    return new BinaryExpression(left, operator, right);
  }

  private peekPrecedence(): Precedence {
    return precedences[this.peekToken.type] || Precedence.LOWEST;
  }

  private curPrecedence(): Precedence {
    return precedences[this.curToken.type] || Precedence.LOWEST;
  }

  private addError(msg: string): void {
    this.errors.push(msg);
  }

  getErrors(): string[] {
    return this.errors;
  }
}

export function parseExpression(expression: string): Expression {
  const lexer = new Lexer(expression);
  const parser = new Parser(lexer);
  return parser.parse();
}
