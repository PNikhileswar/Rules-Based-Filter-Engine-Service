// Service layer: Business logic

import { Rule, RuleRepository, EvaluationResult } from '../domain/rule';
import { Expression } from '../domain/ast';
import { parseExpression } from '../parser/parser';
import { Evaluator } from '../evaluator/evaluator';

const MAX_ID_LENGTH = 100;
const MAX_EXPRESSION_LENGTH = 1000;
const MAX_DESCRIPTION_LENGTH = 500;

export class RuleService {
  private astCache: Map<string, Expression> = new Map();

  constructor(private repository: RuleRepository) {}

  async createRule(
    id: string,
    expression: string,
    description?: string
  ): Promise<Rule> {
    // Input validation and sanitization
    id = id?.trim() || '';
    expression = expression?.trim() || '';
    description = description?.trim();

    if (!id) {
      throw new Error('Rule ID cannot be empty');
    }

    if (id.length > MAX_ID_LENGTH) {
      throw new Error(`Rule ID cannot exceed ${MAX_ID_LENGTH} characters`);
    }

    if (!expression) {
      throw new Error('Expression cannot be empty');
    }

    if (expression.length > MAX_EXPRESSION_LENGTH) {
      throw new Error(`Expression cannot exceed ${MAX_EXPRESSION_LENGTH} characters`);
    }

    if (description && description.length > MAX_DESCRIPTION_LENGTH) {
      throw new Error(`Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters`);
    }

    if (await this.repository.exists(id)) {
      throw new Error(`Rule with id '${id}' already exists`);
    }

    // Validate expression by parsing and cache the AST
    const ast = this.validateAndCacheExpression(id, expression);

    const now = new Date();
    const rule: Rule = {
      id,
      expression,
      description,
      createdAt: now,
      updatedAt: now,
    };

    await this.repository.create(rule);
    return rule;
  }

  async getRule(id: string): Promise<Rule> {
    const rule = await this.repository.getById(id);
    if (!rule) {
      throw new Error(`No rule found with id: ${id}`);
    }
    return rule;
  }

  async getAllRules(): Promise<Rule[]> {
    return this.repository.getAll();
  }

  async updateRule(
    id: string,
    expression: string,
    description?: string
  ): Promise<Rule> {
    const rule = await this.getRule(id);

    // Input sanitization
    expression = expression?.trim() || '';
    description = description?.trim();

    if (!expression) {
      throw new Error('Expression cannot be empty');
    }

    if (expression.length > MAX_EXPRESSION_LENGTH) {
      throw new Error(`Expression cannot exceed ${MAX_EXPRESSION_LENGTH} characters`);
    }

    if (description && description.length > MAX_DESCRIPTION_LENGTH) {
      throw new Error(`Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters`);
    }

    // Validate new expression and update cache
    this.validateAndCacheExpression(id, expression);

    rule.expression = expression;
    rule.description = description;
    rule.updatedAt = new Date();

    await this.repository.update(rule);
    return rule;
  }

  async deleteRule(id: string): Promise<void> {
    await this.repository.delete(id);
    // Clear cached AST
    this.astCache.delete(id);
  }

  async evaluateRule(
    id: string,
    data: Record<string, any>
  ): Promise<EvaluationResult> {
    const rule = await this.getRule(id);

    try {
      // Use cached AST or parse and cache
      let expr = this.astCache.get(id);
      if (!expr) {
        expr = parseExpression(rule.expression);
        this.astCache.set(id, expr);
      }

      const evaluator = new Evaluator(data);
      const { result, details } = evaluator.evaluate(expr);

      return {
        ruleId: rule.id,
        result,
        details,
      };
    } catch (error) {
      throw new Error(
        `Failed to evaluate rule: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private validateAndCacheExpression(id: string, expression: string): Expression {
    try {
      const ast = parseExpression(expression);
      this.astCache.set(id, ast);
      return ast;
    } catch (error) {
      throw new Error(
        `InvalidExpression: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Clear cache for testing or maintenance
  clearCache(): void {
    this.astCache.clear();
  }

  getCacheSize(): number {
    return this.astCache.size;
  }
}
