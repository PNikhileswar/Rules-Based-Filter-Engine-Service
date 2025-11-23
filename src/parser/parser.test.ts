import { Lexer } from './lexer';
import { Parser, parseExpression } from './parser';
import { TokenType } from '../domain/token';

describe('Lexer', () => {
  it('should tokenize simple comparison', () => {
    const lexer = new Lexer('age > 18');
    const tokens = [];
    
    let tok = lexer.nextToken();
    while (tok.type !== TokenType.EOF) {
      tokens.push(tok.type);
      tok = lexer.nextToken();
    }
    
    expect(tokens).toEqual([
      TokenType.IDENTIFIER,
      TokenType.GREATER,
      TokenType.NUMBER,
    ]);
  });

  it('should tokenize complex expression', () => {
    const lexer = new Lexer("age >= 18 AND country = 'US'");
    const tokens = [];
    
    let tok = lexer.nextToken();
    while (tok.type !== TokenType.EOF) {
      tokens.push(tok.type);
      tok = lexer.nextToken();
    }
    
    expect(tokens).toEqual([
      TokenType.IDENTIFIER,
      TokenType.GREATER_EQUAL,
      TokenType.NUMBER,
      TokenType.AND,
      TokenType.IDENTIFIER,
      TokenType.EQUAL,
      TokenType.STRING,
    ]);
  });
});

describe('Parser', () => {
  it('should parse simple expression', () => {
    expect(() => parseExpression('age > 18')).not.toThrow();
  });

  it('should parse AND expression', () => {
    expect(() => parseExpression("age >= 18 AND country = 'US'")).not.toThrow();
  });

  it('should parse OR expression', () => {
    expect(() => parseExpression("country = 'US' OR country = 'UK'")).not.toThrow();
  });

  it('should parse complex expression', () => {
    expect(() =>
      parseExpression("age >= 18 AND country = 'US' AND likes >= 100")
    ).not.toThrow();
  });

  it('should throw error for invalid expression', () => {
    expect(() => parseExpression('age >')).toThrow();
  });

  it('should throw error for missing operator', () => {
    expect(() => parseExpression('age 18')).toThrow();
  });
});
