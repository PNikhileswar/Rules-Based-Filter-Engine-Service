// Core domain entities and interfaces

export interface Rule {
  id: string;
  expression: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RuleRepository {
  create(rule: Rule): Promise<void>;
  getById(id: string): Promise<Rule | null>;
  getAll(): Promise<Rule[]>;
  update(rule: Rule): Promise<void>;
  delete(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;
}

export interface EvaluationResult {
  ruleId: string;
  result: boolean;
  details: ClauseDetails[];
}

export interface ClauseDetails {
  clause: string;
  result: boolean;
}
