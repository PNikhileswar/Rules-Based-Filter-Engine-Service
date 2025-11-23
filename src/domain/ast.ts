// Abstract Syntax Tree node definitions

import { Token } from './token';

export interface ASTNode {
  tokenLiteral(): string;
}

export interface Expression extends ASTNode {
  expressionNode(): void;
}

export class BinaryExpression implements Expression {
  constructor(
    public left: Expression,
    public operator: Token,
    public right: Expression
  ) {}

  expressionNode(): void {}
  tokenLiteral(): string {
    return this.operator.literal;
  }
}

export class LogicalExpression implements Expression {
  constructor(
    public left: Expression,
    public operator: Token,
    public right: Expression
  ) {}

  expressionNode(): void {}
  tokenLiteral(): string {
    return this.operator.literal;
  }
}

export class Identifier implements Expression {
  constructor(public token: Token, public value: string) {}

  expressionNode(): void {}
  tokenLiteral(): string {
    return this.token.literal;
  }
}

export class NumberLiteral implements Expression {
  constructor(public token: Token, public value: number) {}

  expressionNode(): void {}
  tokenLiteral(): string {
    return this.token.literal;
  }
}

export class StringLiteral implements Expression {
  constructor(public token: Token, public value: string) {}

  expressionNode(): void {}
  tokenLiteral(): string {
    return this.token.literal;
  }
}
