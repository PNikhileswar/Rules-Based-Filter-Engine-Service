// HTTP request handlers for the REST API

import { Request, Response } from 'express';
import { RuleService } from '../service/rule-service';
import { Rule } from '../domain/rule';

export class RuleHandler {
  constructor(private service: RuleService) {}

  createRule = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id, expression, description } = req.body;

      if (!id) {
        res.status(400).json({
          error: 'InvalidRequest',
          message: "Field 'id' is required",
        });
        return;
      }

      if (!expression) {
        res.status(400).json({
          error: 'InvalidRequest',
          message: "Field 'expression' is required",
        });
        return;
      }

      const rule = await this.service.createRule(id, expression, description);
      res.status(201).json(this.toRuleResponse(rule));
    } catch (error) {
      this.handleError(error, res);
    }
  };

  getAllRules = async (req: Request, res: Response): Promise<void> => {
    try {
      const rules = await this.service.getAllRules();
      res.status(200).json({
        items: rules.map((r) => this.toRuleResponse(r)),
        total: rules.length,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  getRule = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const rule = await this.service.getRule(id);
      res.status(200).json(this.toRuleResponse(rule));
    } catch (error) {
      this.handleError(error, res);
    }
  };

  updateRule = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { expression, description } = req.body;

      if (!expression) {
        res.status(400).json({
          error: 'InvalidRequest',
          message: "Field 'expression' is required",
        });
        return;
      }

      const rule = await this.service.updateRule(id, expression, description);
      res.status(200).json(this.toRuleResponse(rule));
    } catch (error) {
      this.handleError(error, res);
    }
  };

  deleteRule = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await this.service.deleteRule(id);
      res.status(200).json({
        message: `Rule ${id} deleted successfully.`,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  evaluateRule = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { data } = req.body;

      if (!data) {
        res.status(400).json({
          error: 'InvalidRequest',
          message: "Field 'data' is required",
        });
        return;
      }

      const result = await this.service.evaluateRule(id, data);
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  private toRuleResponse(rule: Rule) {
    return {
      id: rule.id,
      expression: rule.expression,
      description: rule.description,
      createdAt: rule.createdAt.toISOString(),
      updatedAt: rule.updatedAt.toISOString(),
    };
  }

  private handleError(error: unknown, res: Response): void {
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message.includes('InvalidExpression') || message.includes('Parsing errors')) {
      res.status(400).json({
        error: 'InvalidExpression',
        message,
      });
    } else if (message.includes('already exists')) {
      res.status(409).json({
        error: 'RuleAlreadyExists',
        message,
      });
    } else if (message.includes('no rule found') || message.includes('No rule found')) {
      res.status(404).json({
        error: 'RuleNotFound',
        message,
      });
    } else {
      res.status(500).json({
        error: 'InternalError',
        message,
      });
    }
  }
}
