// Evaluator: Evaluates AST against data

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

export class Evaluator {
  private details: ClauseDetails[] = [];

  constructor(private data: Record<string, any>) {}

  evaluate(expr: Expression): { result: boolean; details: ClauseDetails[] } {
    this.details = [];
    const result = this.eval(expr, true);
    return { result, details: this.details };
  }

  private eval(expr: Expression, trackDetails: boolean): boolean {
    if (expr instanceof LogicalExpression) {
      return this.evalLogicalExpression(expr, trackDetails);
    } else if (expr instanceof BinaryExpression) {
      return this.evalBinaryExpression(expr, trackDetails);
    }
    throw new Error(`Unexpected expression type: ${expr.constructor.name}`);
  }

  private evalLogicalExpression(
    expr: LogicalExpression,
    trackDetails: boolean
  ): boolean {
    const leftResult = this.eval(expr.left, trackDetails);
    const rightResult = this.eval(expr.right, trackDetails);

    switch (expr.operator.type) {
      case TokenType.AND:
        return leftResult && rightResult;
      case TokenType.OR:
        return leftResult || rightResult;
      default:
        throw new Error(`Unknown logical operator: ${expr.operator.literal}`);
    }
  }

  private evalBinaryExpression(
    expr: BinaryExpression,
    trackDetails: boolean
  ): boolean {
    if (!(expr.left instanceof Identifier)) {
      throw new Error('Left side of comparison must be an identifier');
    }

    const fieldName = expr.left.value;
    const dataValue = this.data[fieldName];

    // Missing field - evaluate to false
    if (dataValue === undefined) {
      const result = false;
      if (trackDetails) {
        this.addDetail(this.formatClause(expr), result);
      }
      return result;
    }

    let expectedValue: any;
    if (expr.right instanceof NumberLiteral) {
      expectedValue = expr.right.value;
    } else if (expr.right instanceof StringLiteral) {
      expectedValue = expr.right.value;
    } else {
      throw new Error('Right side of comparison must be a literal value');
    }

    const result = this.compare(dataValue, expr.operator.type, expectedValue);
    if (trackDetails) {
      this.addDetail(this.formatClause(expr), result);
    }

    return result;
  }

  private compare(left: any, operator: TokenType, right: any): boolean {
    switch (operator) {
      case TokenType.EQUAL:
        return this.equals(left, right);
      case TokenType.NOT_EQUAL:
        return !this.equals(left, right);
      case TokenType.GREATER:
        return this.greaterThan(left, right);
      case TokenType.LESS:
        return this.lessThan(left, right);
      case TokenType.GREATER_EQUAL:
        return this.greaterThan(left, right) || this.equals(left, right);
      case TokenType.LESS_EQUAL:
        return this.lessThan(left, right) || this.equals(left, right);
      default:
        throw new Error(`Unknown comparison operator: ${operator}`);
    }
  }

  private equals(left: any, right: any): boolean {
    // Direct equality
    if (left === right) return true;

    // Numeric comparison with type coercion
    const leftNum = this.toNumber(left);
    const rightNum = this.toNumber(right);
    if (leftNum !== null && rightNum !== null) {
      return leftNum === rightNum;
    }

    // String comparison
    if (typeof left === 'string' && typeof right === 'string') {
      return left === right;
    }

    return false;
  }

  private greaterThan(left: any, right: any): boolean {
    const leftNum = this.toNumber(left);
    const rightNum = this.toNumber(right);

    if (leftNum === null || rightNum === null) {
      throw new Error('Cannot compare non-numeric values with > operator');
    }

    return leftNum > rightNum;
  }

  private lessThan(left: any, right: any): boolean {
    const leftNum = this.toNumber(left);
    const rightNum = this.toNumber(right);

    if (leftNum === null || rightNum === null) {
      throw new Error('Cannot compare non-numeric values with < operator');
    }

    return leftNum < rightNum;
  }

  private toNumber(val: any): number | null {
    if (typeof val === 'number' && !isNaN(val)) {
      return val;
    }
    return null;
  }

  private addDetail(clause: string, result: boolean): void {
    this.details.push({ clause, result });
  }

  private formatClause(expr: BinaryExpression): string {
    const left = expr.left instanceof Identifier ? expr.left.value : '';
    const operator = expr.operator.literal;
    let right = '';

    if (expr.right instanceof NumberLiteral) {
      right = expr.right.token.literal;
    } else if (expr.right instanceof StringLiteral) {
      right = `'${expr.right.value}'`;
    }

    return `${left} ${operator} ${right}`;
  }
}
