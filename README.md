# Rules-Based Filter Engine Service

A high-performance, production-ready backend service for creating, managing, and evaluating rules against JSON data. Built with TypeScript + Node.js + Express for the Backend Internship technical challenge.

> **🎉 Latest Updates**: Added AST caching (5-10x performance boost), health check endpoint, graceful shutdown, enhanced input validation, and detailed error messages with position tracking. See [OPTIMIZATION_REPORT.md](OPTIMIZATION_REPORT.md) for details.

## 🎯 Project Overview

This service implements a rules engine that allows users to:
- Define rules using human-readable expressions (e.g., `age >= 18 AND country = 'US'`)
- Store and manage rules via RESTful API
- Evaluate JSON data against rules with detailed results

## 🏗️ Architecture & Design Decisions

### Technology Choice: TypeScript + Node.js + Express

**Why TypeScript?**
1. **Type Safety**: Strong static typing catches errors at compile time, just like compiled languages
2. **Modern JavaScript**: ES2020+ features with full IDE support and autocomplete
3. **Excellent Tooling**: Best-in-class development experience with VS Code
4. **Industry Standard**: Used by major companies (Microsoft, Airbnb, Slack) for backend services
5. **Easy to Learn**: JavaScript syntax you already know, with type annotations
6. **Rich Ecosystem**: npm has packages for everything, mature testing frameworks

**Why Express?**
- Minimalist, unopinionated framework
- Industry standard for Node.js APIs
- Excellent middleware support
- Fast and lightweight
- Perfect for RESTful APIs

### Architecture Pattern: Clean Architecture

```
cmd/
  └── server/          # Application entry point
internal/
  ├── domain/          # Core business entities and interfaces
  ├── parser/          # Lexer and Parser for expression parsing
  ├── evaluator/       # Rule evaluation engine
  ├── repository/      # Data persistence layer
  ├── service/         # Business logic layer
  └── handler/         # HTTP handlers and routing
```

**Separation of Concerns:**
- **Domain Layer**: Pure business logic, no dependencies
- **Parser Layer**: Lexer → Tokens → Parser → AST (Abstract Syntax Tree)
- **Evaluator Layer**: AST traversal and evaluation
- **Repository Layer**: Interface-based, easily swappable (memory → database)
- **Service Layer**: Orchestrates business operations
- **Handler Layer**: HTTP concerns only

### Key Technical Decisions

#### 1. Custom Parser vs External Library
**Decision**: Built a custom lexer and parser using the Pratt parsing algorithm

**Justification**:
- The challenge explicitly requires not using a full rules engine library
- Custom implementation demonstrates deep understanding of:
  - Lexical analysis (tokenization)
  - Syntax analysis (parsing)
  - Abstract Syntax Trees
  - Operator precedence handling
- Gives full control over error messages and validation
- No external dependencies = smaller binary, easier deployment

#### 2. Abstract Syntax Tree (AST) Pattern
**Decision**: Parse expressions into an AST before evaluation

**Justification**:
- **Separation**: Parsing and evaluation are decoupled
- **Extensibility**: Easy to add new operators or optimize evaluations
- **Debugging**: Can inspect parsed tree structure
- **Validation**: Syntax errors caught during parsing, not evaluation
- **Performance**: Parse once, evaluate many times (can cache AST)

#### 3. In-Memory Storage with Thread-Safe Map
**Decision**: Use `sync.RWMutex` protected map for storage

**Justification**:
- Simple and fast for demonstration purposes
- Thread-safe for concurrent access
- Interface-based design makes database swap trivial:
  ```go
  type RuleRepository interface {
      Create(rule *Rule) error
      GetByID(id string) (*Rule, error)
      // ... other methods
  }
  ```
- Production upgrade path: implement interface with PostgreSQL/MongoDB

#### 4. Detailed Evaluation Results
**Decision**: Return clause-by-clause evaluation details

**Justification**:
- Debugging: Users can see exactly which clause failed
- Transparency: Clear insight into rule evaluation
- Edge Case Handling: Missing fields reported per clause
- As per spec: `"details": [{"clause": "age >= 18", "result": true}]`

#### 5. Type Coercion in Comparisons
**Decision**: Automatic numeric type conversion (int → float64)

**Justification**:
- **User Experience**: JSON numbers can be int or float
- **Flexibility**: Works with various JSON encoders
- **Predictability**: Clear coercion rules:
  - All numeric types → float64 for comparisons
  - String comparisons remain strict
  - Missing fields → clause evaluates to false

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (Download from https://nodejs.org/)
- npm (comes with Node.js)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/PNikhileswar/Rules-Based-Filter-Engine-Service.git
   cd Rules-Based-Filter-Engine-Service
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the service** (Development mode with auto-reload)
   ```bash
   npm run dev
   ```

   The server will start on `http://localhost:8080`

4. **Run tests**
   ```bash
   npm test
   ```

   For coverage report:
   ```bash
   npm run test:coverage
   ```

5. **Build for production**
   ```bash
   npm run build
   npm start
   ```

## 📚 API Documentation

Base URL: `http://localhost:8080`

### 1. Create Rule
**POST** `/rules`

Create a new rule with an expression.

**Request:**
```json
{
  "id": "rule_popular_us",
  "expression": "age >= 18 AND country = 'US' AND likes >= 100",
  "description": "User is an adult in the US with at least 100 likes"
}
```

**Response (201 Created):**
```json
{
  "id": "rule_popular_us",
  "expression": "age >= 18 AND country = 'US' AND likes >= 100",
  "description": "User is an adult in the US with at least 100 likes",
  "createdAt": "2025-01-01T10:00:00Z",
  "updatedAt": "2025-01-01T10:00:00Z"
}
```

**Error (400 Bad Request):**
```json
{
  "error": "InvalidExpression",
  "message": "Failed to parse expression near token: ANDD"
}
```

### 2. List All Rules
**GET** `/rules`

Retrieve all rules.

**Response (200 OK):**
```json
{
  "items": [
    {
      "id": "rule_popular_us",
      "expression": "age >= 18 AND country = 'US' AND likes >= 100",
      "description": "User is an adult in the US with at least 100 likes",
      "createdAt": "2025-01-01T10:00:00Z",
      "updatedAt": "2025-01-01T10:00:00Z"
    }
  ],
  "total": 1
}
```

### 3. Get Rule by ID
**GET** `/rules/:id`

Retrieve a specific rule.

**Response (200 OK):**
```json
{
  "id": "rule_popular_us",
  "expression": "age >= 18 AND country = 'US' AND likes >= 100",
  "description": "User is an adult in the US with at least 100 likes",
  "createdAt": "2025-01-01T10:00:00Z",
  "updatedAt": "2025-01-01T10:00:00Z"
}
```

**Error (404 Not Found):**
```json
{
  "error": "RuleNotFound",
  "message": "No rule found with id: rule_unknown"
}
```

### 4. Update Rule
**PUT** `/rules/:id`

Update an existing rule.

**Request:**
```json
{
  "expression": "age >= 21 AND country = 'US' AND likes >= 200",
  "description": "User is 21+ in the US with at least 200 likes"
}
```

**Response (200 OK):**
```json
{
  "id": "rule_popular_us",
  "expression": "age >= 21 AND country = 'US' AND likes >= 200",
  "description": "User is 21+ in the US with at least 200 likes",
  "createdAt": "2025-01-01T10:00:00Z",
  "updatedAt": "2025-01-03T12:30:00Z"
}
```

### 5. Delete Rule
**DELETE** `/rules/:id`

Delete a rule.

**Response (200 OK):**
```json
{
  "message": "Rule rule_popular_us deleted successfully."
}
```

### 6. Evaluate Rule
**POST** `/rules/:id/evaluate`

Evaluate JSON data against a rule.

**Request:**
```json
{
  "data": {
    "age": 22,
    "country": "US",
    "likes": 150,
    "comments": 3
  }
}
```

**Response (200 OK) - Rule matches:**
```json
{
  "ruleId": "rule_popular_us",
  "result": true,
  "details": [
    { "clause": "age >= 18", "result": true },
    { "clause": "country = 'US'", "result": true },
    { "clause": "likes >= 100", "result": true }
  ]
}
```

**Response (200 OK) - Rule doesn't match:**
```json
{
  "ruleId": "rule_popular_us",
  "result": false,
  "details": [
    { "clause": "age >= 18", "result": true },
    { "clause": "country = 'US'", "result": false },
    { "clause": "likes >= 100", "result": true }
  ]
}
```

## 🧪 Testing Examples

### Using cURL

**Create a rule:**
```bash
curl -X POST http://localhost:8080/rules \
  -H "Content-Type: application/json" \
  -d '{
    "id": "adult_us_users",
    "expression": "age >= 18 AND country = '\''US'\''",
    "description": "Adult users in the US"
  }'
```

**Evaluate data:**
```bash
curl -X POST http://localhost:8080/rules/adult_us_users/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "age": 25,
      "country": "US"
    }
  }'
```

### Using PowerShell (Windows)

```powershell
# Create a rule
Invoke-RestMethod -Uri "http://localhost:8080/rules" -Method Post -ContentType "application/json" -Body '{
  "id": "test_rule",
  "expression": "age > 18",
  "description": "Test rule"
}'

# Evaluate
Invoke-RestMethod -Uri "http://localhost:8080/rules/test_rule/evaluate" -Method Post -ContentType "application/json" -Body '{
  "data": {"age": 25}
}'
```

## 🔍 Supported Operators

### Comparison Operators
- `=` - Equal to
- `!=` - Not equal to
- `>` - Greater than
- `<` - Less than
- `>=` - Greater than or equal to
- `<=` - Less than or equal to

### Logical Operators
- `AND` - Logical AND (both conditions must be true)
- `OR` - Logical OR (at least one condition must be true)

### Data Types
- **Numbers**: Integers and decimals (e.g., `18`, `99.99`)
- **Strings**: Single-quoted (e.g., `'US'`, `'active'`)
- **Identifiers**: Field names (e.g., `age`, `country`, `likes`)

### Expression Examples
```
age > 18
country = 'US'
age >= 18 AND country = 'US'
country = 'US' OR country = 'UK' OR country = 'CA'
age >= 13 AND age <= 19 AND status = 'active'
price >= 99.99 AND category = 'electronics'
```

## 🛡️ Error Handling

The service handles various error scenarios with appropriate HTTP status codes:

| Status Code | Error Type | Description |
|-------------|-----------|-------------|
| 400 | InvalidExpression | Malformed rule expression |
| 400 | InvalidRequest | Missing required fields or invalid JSON |
| 404 | RuleNotFound | Rule ID doesn't exist |
| 409 | RuleAlreadyExists | Duplicate rule ID |
| 500 | InternalError | Server-side error |

### Edge Cases Handled

1. **Missing Fields in Data**: Treated as false for that clause
2. **Type Mismatches**: Clear error messages for invalid comparisons
3. **Empty Expressions**: Validation error
4. **Invalid Syntax**: Detailed parsing errors with position
5. **Concurrent Access**: Thread-safe operations with mutex
6. **Numeric Type Coercion**: Automatic int/float conversion

## 🧩 Project Structure

```
Rules-Based-Filter-Engine-Service/
├── cmd/
│   └── server/
│       └── main.go                 # Application entry point
├── internal/
│   ├── domain/
│   │   ├── ast.go                  # Abstract Syntax Tree nodes
│   │   ├── rule.go                 # Rule entity and interfaces
│   │   └── token.go                # Token types and definitions
│   ├── parser/
│   │   ├── lexer.go                # Tokenization
│   │   ├── parser.go               # Expression parsing
│   │   └── parser_test.go          # Parser tests
│   ├── evaluator/
│   │   ├── evaluator.go            # Rule evaluation engine
│   │   └── evaluator_test.go       # Evaluator tests
│   ├── repository/
│   │   └── memory.go               # In-memory storage
│   ├── service/
│   │   ├── rule_service.go         # Business logic
│   │   └── rule_service_test.go    # Service tests
│   └── handler/
│       ├── rule_handler.go         # HTTP request handlers
│       └── router.go               # HTTP routing
├── go.mod                          # Go module definition
├── .gitignore                      # Git ignore rules
└── README.md                       # This file
```

## 🎓 Design Patterns Used

1. **Repository Pattern**: Abstracts data access
2. **Dependency Injection**: Services receive dependencies via constructor
3. **Interface Segregation**: Small, focused interfaces
4. **Pratt Parsing**: Elegant operator precedence handling
5. **Visitor Pattern**: AST traversal for evaluation
6. **Strategy Pattern**: Different evaluation strategies per node type

## 🚀 Performance Considerations

1. **O(n) Parsing**: Linear time complexity for expression parsing
2. **O(n) Evaluation**: Linear time based on expression tree depth
3. **Thread-Safe**: RWMutex allows concurrent reads
4. **Memory Efficient**: No unnecessary allocations in hot paths
5. **Fast Compilation**: Go compiles to native code

## 🔄 Future Enhancements

If extended for production:

1. **Persistent Storage**: PostgreSQL/MongoDB implementation
2. **Caching**: Cache parsed ASTs for frequently used rules
3. **Rule Versioning**: Track rule changes over time
4. **Batch Evaluation**: Evaluate multiple rules at once
5. **Advanced Operators**: IN, CONTAINS, REGEX support
6. **Rule Composition**: Combine rules with references
7. **Metrics & Monitoring**: Prometheus metrics
8. **API Authentication**: JWT/OAuth2 support
9. **Rate Limiting**: Protect against abuse
10. **GraphQL API**: Alternative to REST

## 📝 Testing

Run all tests:
```bash
go test ./...
```

Run tests with coverage:
```bash
go test -cover ./...
```

Run specific test:
```bash
go test -v ./internal/parser -run TestParseExpression
```

## 🤔 Alternative Approaches Considered

### 1. Expression Evaluation
- **Chosen**: Custom lexer + parser → AST
- **Alternative**: Regex-based parsing
  - ❌ Complex expressions hard to handle
  - ❌ Poor error messages
  - ❌ Limited extensibility

### 2. Storage
- **Chosen**: In-memory with interface
- **Alternative**: Direct database integration
  - ❌ Adds complexity for demo
  - ✅ Current design allows easy upgrade

### 3. Language Choice
- **Chosen**: Go
- **Alternatives**:
  - **Node.js**: ❌ Slower, dynamic typing
  - **Python**: ❌ Performance overhead, GIL issues
  - **Rust**: ✅ Faster but steeper learning curve

## 📧 Contact

**Name**: Nikhileswar Palivela  
**GitHub**: [@PNikhileswar](https://github.com/PNikhileswar)

## 📄 License

This project is part of a technical assessment and is for evaluation purposes.

---

**Built with ❤️ using Go for Backend Internship Technical Challenge**
