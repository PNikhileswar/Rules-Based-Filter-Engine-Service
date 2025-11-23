import { Evaluator } from './evaluator';
import { parseExpression } from '../parser/parser';

describe('Evaluator', () => {
  it('should evaluate simple greater than - true', () => {
    const expr = parseExpression('age > 18');
    const evaluator = new Evaluator({ age: 25 });
    const { result } = evaluator.evaluate(expr);
    expect(result).toBe(true);
  });

  it('should evaluate simple greater than - false', () => {
    const expr = parseExpression('age > 18');
    const evaluator = new Evaluator({ age: 15 });
    const { result } = evaluator.evaluate(expr);
    expect(result).toBe(false);
  });

  it('should evaluate string equality - true', () => {
    const expr = parseExpression("country = 'US'");
    const evaluator = new Evaluator({ country: 'US' });
    const { result } = evaluator.evaluate(expr);
    expect(result).toBe(true);
  });

  it('should evaluate string equality - false', () => {
    const expr = parseExpression("country = 'US'");
    const evaluator = new Evaluator({ country: 'UK' });
    const { result } = evaluator.evaluate(expr);
    expect(result).toBe(false);
  });

  it('should evaluate AND expression - true', () => {
    const expr = parseExpression("age >= 18 AND country = 'US'");
    const evaluator = new Evaluator({ age: 22, country: 'US' });
    const { result } = evaluator.evaluate(expr);
    expect(result).toBe(true);
  });

  it('should evaluate AND expression - false', () => {
    const expr = parseExpression("age >= 18 AND country = 'US'");
    const evaluator = new Evaluator({ age: 22, country: 'UK' });
    const { result } = evaluator.evaluate(expr);
    expect(result).toBe(false);
  });

  it('should evaluate OR expression - true', () => {
    const expr = parseExpression("country = 'US' OR country = 'UK'");
    const evaluator = new Evaluator({ country: 'UK' });
    const { result } = evaluator.evaluate(expr);
    expect(result).toBe(true);
  });

  it('should evaluate complex expression - true', () => {
    const expr = parseExpression("age >= 18 AND country = 'US' AND likes >= 100");
    const evaluator = new Evaluator({ age: 22, country: 'US', likes: 150 });
    const { result } = evaluator.evaluate(expr);
    expect(result).toBe(true);
  });

  it('should evaluate complex expression - false', () => {
    const expr = parseExpression("age >= 18 AND country = 'US' AND likes >= 100");
    const evaluator = new Evaluator({ age: 22, country: 'US', likes: 50 });
    const { result } = evaluator.evaluate(expr);
    expect(result).toBe(false);
  });

  it('should handle missing field - false', () => {
    const expr = parseExpression('age > 18');
    const evaluator = new Evaluator({ name: 'John' });
    const { result } = evaluator.evaluate(expr);
    expect(result).toBe(false);
  });

  it('should evaluate not equal - true', () => {
    const expr = parseExpression("status != 'banned'");
    const evaluator = new Evaluator({ status: 'active' });
    const { result } = evaluator.evaluate(expr);
    expect(result).toBe(true);
  });

  it('should evaluate less than or equal - true', () => {
    const expr = parseExpression('age <= 19');
    const evaluator = new Evaluator({ age: 19 });
    const { result } = evaluator.evaluate(expr);
    expect(result).toBe(true);
  });

  it('should evaluate decimal numbers', () => {
    const expr = parseExpression('price >= 99.99');
    const evaluator = new Evaluator({ price: 100.5 });
    const { result } = evaluator.evaluate(expr);
    expect(result).toBe(true);
  });

  it('should return detailed results', () => {
    const expr = parseExpression("age >= 18 AND country = 'US'");
    const evaluator = new Evaluator({ age: 22, country: 'US' });
    const { details } = evaluator.evaluate(expr);
    
    expect(details).toHaveLength(2);
    expect(details[0].clause).toBe('age >= 18');
    expect(details[0].result).toBe(true);
    expect(details[1].clause).toBe("country = 'US'");
    expect(details[1].result).toBe(true);
  });
});
