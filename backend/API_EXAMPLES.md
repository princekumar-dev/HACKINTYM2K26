# API Examples & Usage

Complete examples of all backend API endpoints with real requests and responses.

## Base URL
```
http://localhost:3001/api
```

## 1. URL Monitoring API

### Analyze Single URL

**Request:**
```bash
curl -X POST http://localhost:3001/api/monitoring/analyze-url \
  -H "Content-Type: application/json" \
  -d {
    "url": "https://github.com"
  }'
```

**Response (200 OK):**
```json
{
  "url": "https://github.com",
  "statusCode": 200,
  "latency": 342,
  "healthScore": 95,
  "performanceScore": 88,
  "responseTime": 342,
  "uptime": 99.9,
  "errorRate": 1,
  "suggestions": [
    "Website is performing normally."
  ],
  "metrics": {
    "dns": 45.2,
    "tcp": 98.5,
    "tls": 29.6,
    "firstByte": 143.7,
    "pageLoad": 342,
    "resourceSize": 256234
  },
  "timestamp": "2024-09-15T10:30:00.000Z"
}
```

### Bulk Analyze URLs

**Request:**
```bash
curl -X POST http://localhost:3001/api/monitoring/bulk-analyze \
  -H "Content-Type: application/json" \
  -d '[
    { "url": "https://github.com" },
    { "url": "https://google.com" },
    { "url": "https://stackoverflow.com" }
  ]'
```

**Response (200 OK):**
```json
[
  {
    "url": "https://github.com",
    "statusCode": 200,
    "latency": 342,
    "healthScore": 95,
    "performanceScore": 88,
    ...
  },
  {
    "url": "https://google.com",
    "statusCode": 200,
    "latency": 198,
    "healthScore": 98,
    "performanceScore": 96,
    ...
  },
  ...
]
```

### Error Response Example

**Request:**
```bash
curl -X POST http://localhost:3001/api/monitoring/analyze-url \
  -H "Content-Type: application/json" \
  -d '{"url": "https://invalid-domain-that-does-not-exist-12345.com"}'
```

**Response (200 OK - still returns structured error data):**
```json
{
  "url": "https://invalid-domain-that-does-not-exist-12345.com",
  "statusCode": 0,
  "latency": 0,
  "healthScore": 0,
  "performanceScore": 0,
  "responseTime": 0,
  "uptime": 0,
  "errorRate": 100,
  "suggestions": [
    "URL is unreachable",
    "Check network connectivity",
    "Verify URL format and domain availability",
    "getaddrinfo ENOTFOUND invalid-domain..."
  ],
  "metrics": {
    "dns": 0,
    "tcp": 0,
    "tls": 0,
    "firstByte": 0,
    "pageLoad": 0,
    "resourceSize": 0
  },
  "timestamp": "2024-09-15T10:30:00.000Z"
}
```

## 2. Code Analysis API

### Analyze JavaScript Code

**Request:**
```bash
curl -X POST http://localhost:3001/api/analysis/analyze-code \
  -H "Content-Type: application/json" \
  -d '{
    "code": "function calculateSum(numbers) {\n  return numbers.reduce((a, b) => a + b, 0);\n}",
    "language": "javascript"
  }'
```

**Response (200 OK):**
```json
{
  "code": "function calculateSum(numbers) {\n  return numbers.reduce((a, b) => a + b, 0);\n}",
  "language": "javascript",
  "complexity": 1,
  "healthScore": 95,
  "performanceScore": 92,
  "maintainabilityScore": 98,
  "issues": [],
  "suggestions": [
    "Code quality is good. Keep up the standards!"
  ],
  "lineCount": 3,
  "functionCount": 1,
  "dependencies": [],
  "metrics": {
    "cyclomaticComplexity": 1,
    "halsteadComplexity": 4.24,
    "maintainabilityIndex": 98.5,
    "linesOfCode": 3,
    "commentRatio": 0
  },
  "timestamp": "2024-09-15T10:30:00.000Z"
}
```

### Analyze Code with Issues

**Request:**
```bash
curl -X POST http://localhost:3001/api/analysis/analyze-code \
  -H "Content-Type: application/json" \
  -d '{
    "code": "function badly_written_function() {\n  console.log(\"test\");\n  if (x > 5) {\n    if (y < 10) {\n      if (z === 15) {\n        eval(\"dangerous\");\n        innerHTML = \"<script>alert(1)</script>\";\n        // TODO: Fix this\n      }\n    }\n  }\n}",
    "language": "javascript"
  }'
```

**Response (200 OK):**
```json
{
  "code": "...",
  "language": "javascript",
  "complexity": 4,
  "healthScore": 35,
  "performanceScore": 42,
  "maintainabilityScore": 45,
  "issues": [
    "Remove console.log statements in production code",
    "Security issue: Potential XSS vulnerability detected",
    "Potential performance issue: Using eval or Function constructor",
    "Code contains TODO/FIXME comments that need resolution"
  ],
  "suggestions": [
    "Refactor: Function complexity is too high. Break into smaller functions.",
    "Performance concern: Consider optimizing algorithms and removing bottlenecks.",
    "Code quality is poor. Address detected issues and add error handling.",
    "Fix 4 detected issues",
    "Maintainability is low: Add comments, refactor long functions, and improve naming."
  ],
  "lineCount": 10,
  "functionCount": 1,
  "dependencies": [],
  "metrics": {
    "cyclomaticComplexity": 4,
    "halsteadComplexity": 28.5,
    "maintainabilityIndex": 45.2,
    "linesOfCode": 10,
    "commentRatio": 10
  },
  "timestamp": "2024-09-15T10:30:00.000Z"
}
```

### Batch Analyze Multiple Code Snippets

**Request:**
```bash
curl -X POST http://localhost:3001/api/analysis/batch-analyze \
  -H "Content-Type: application/json" \
  -d '[
    {
      "code": "function add(a, b) { return a + b; }",
      "language": "javascript"
    },
    {
      "code": "const multiply = (a, b) => a * b;",
      "language": "javascript"
    }
  ]'
```

**Response (200 OK):**
```json
[
  {
    "code": "function add(a, b) { return a + b; }",
    "language": "javascript",
    "complexity": 1,
    "healthScore": 95,
    "performanceScore": 92,
    ...
  },
  {
    "code": "const multiply = (a, b) => a * b;",
    "language": "javascript",
    "complexity": 1,
    "healthScore": 95,
    "performanceScore": 92,
    ...
  }
]
```

## 3. Feature Comparison API

### Compare Feature Implementation

**Request:**
```bash
curl -X POST http://localhost:3001/api/features/compare \
  -H "Content-Type: application/json" \
  -d '{
    "featureName": "caching-system-v2",
    "currentCode": "function getUser(id) {\n  return db.query(\`SELECT * FROM users WHERE id = ${id}\`);\n}",
    "proposedCode": "const cache = {};\nfunction getUser(id) {\n  if (cache[id]) return cache[id];\n  const user = db.query(\`SELECT * FROM users WHERE id = ${id}\`);\n  cache[id] = user;\n  return user;\n}",
    "affectedComponents": ["UserService", "CacheManager", "Database"]
  }'
```

**Response (200 OK):**
```json
{
  "featureName": "caching-system-v2",
  "currentMetrics": {
    "performance": 65,
    "health": 75,
    "latency": 35,
    "memory": 52,
    "cpu": 48,
    "complexity": 1
  },
  "proposedMetrics": {
    "performance": 88,
    "health": 92,
    "latency": 12,
    "memory": 68,
    "cpu": 55,
    "complexity": 2
  },
  "improvements": {
    "performance": 23,
    "health": 17,
    "latency": 23,
    "memory": -16,
    "cpu": -7
  },
  "impactLevel": "high",
  "recommendations": [
    "✅ Significant performance improvement expected",
    "✅ Memory usage optimized",
    "🚀 Significant latency reduction achieved",
    "✓ Ready for testing and deployment"
  ],
  "riskLevel": "low",
  "potentialIssues": [
    "No major risks identified"
  ],
  "injectionMetadata": {
    "affectedComponents": [
      "UserService",
      "CacheManager",
      "Database"
    ],
    "requiredChanges": [
      "Update or add new dependencies",
      "Code replacement with compatibility checks",
      "Update unit tests"
    ],
    "estimatedImplementationTime": 95
  },
  "timestamp": "2024-09-15T10:30:00.000Z"
}
```

### Simulate Feature Injection

**Request:**
```bash
curl -X POST http://localhost:3001/api/features/simulate-injection \
  -H "Content-Type: application/json" \
  -d '{
    "featureName": "new-authentication",
    "currentCode": "app.post(\"/login\", (req, res) => {\n  // Simple check\n  if (req.body.user === \"admin\") res.send(\"OK\");\n});",
    "proposedCode": "const jwt = require(\"jsonwebtoken\");\napp.post(\"/login\", (req, res) => {\n  const user = validateCredentials(req.body);\n  if (user) {\n    const token = jwt.sign(user, process.env.SECRET);\n    res.json({ token });\n  }\n});\nfunction validateCredentials(creds) {\n  return db.validate(creds);\n}",
    "affectedComponents": ["AuthController", "TokenService", "Database"]
  }'
```

**Response (200 OK):**
```json
{
  "featureName": "new-authentication",
  "currentMetrics": {
    "performance": 42,
    "health": 25,
    "latency": 58,
    "memory": 35,
    "cpu": 40,
    "complexity": 1
  },
  "proposedMetrics": {
    "performance": 78,
    "health": 85,
    "latency": 22,
    "memory": 62,
    "cpu": 68,
    "complexity": 3
  },
  "improvements": {
    "performance": 36,
    "health": 60,
    "latency": 36,
    "memory": -27,
    "cpu": -28
  },
  "impactLevel": "high",
  "recommendations": [
    "✅ Significant performance improvement expected",
    "📋 Resolve detected code issues before deployment",
    "🚀 Significant latency reduction achieved",
    "✓ Ready for testing and deployment"
  ],
  "riskLevel": "medium",
  "potentialIssues": [
    "Code complexity increases significantly",
    "New code quality issues introduced"
  ],
  "injectionMetadata": {
    "affectedComponents": [
      "AuthController",
      "TokenService",
      "Database"
    ],
    "requiredChanges": [
      "Update or add new dependencies",
      "Update module exports",
      "Code replacement with compatibility checks",
      "Update unit tests"
    ],
    "estimatedImplementationTime": 180
  },
  "timestamp": "2024-09-15T10:30:00.000Z"
}
```

## 4. Error Handling Examples

### Invalid Request Format

**Request:**
```bash
curl -X POST http://localhost:3001/api/monitoring/analyze-url \
  -H "Content-Type: application/json" \
  -d '{"invalid": "data"}'
```

**Response (400 Bad Request):**
```json
{
  "statusCode": 400,
  "message": "Validation failed: url is required",
  "error": "Bad Request"
}
```

### Server Error

**Response (500 Internal Server Error):**
```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error"
}
```

## 5. Using JavaScript/TypeScript

### Node.js/Express Example

```javascript
const axios = require('axios');

const API = axios.create({
  baseURL: 'http://localhost:3001/api',
});

// Analyze URL
async function analyzeWebsite() {
  try {
    const result = await API.post('/monitoring/analyze-url', {
      url: 'https://example.com'
    });
    console.log('Analysis:', result.data);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Analyze Code
async function analyzeCode() {
  try {
    const result = await API.post('/analysis/analyze-code', {
      code: 'function test() { return 42; }',
      language: 'javascript'
    });
    console.log('Code analysis:', result.data);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Compare Features
async function compareFeature() {
  try {
    const result = await API.post('/features/compare', {
      featureName: 'my-feature',
      currentCode: 'const x = 1;',
      proposedCode: 'const x = 1; const y = 2;',
      affectedComponents: ['Component1']
    });
    console.log('Comparison:', result.data);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

analyzeWebsite();
analyzeCode();
compareFeature();
```

### React Hook Example

```javascript
import { useState, useEffect } from 'react';

function useCodeAnalysis() {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const analyze = async (code, language = 'javascript') => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        'http://localhost:3001/api/analysis/analyze-code',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, language })
        }
      );
      const data = await response.json();
      setAnalysis(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { analysis, loading, error, analyze };
}

export default useCodeAnalysis;
```

## 6. Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad Request (validation error) |
| 500 | Internal Server Error |

## 7. Rate Limiting

- No rate limiting by default
- Recommended: Implement rate limiting in production
- Suggested: 100 requests per minute per IP

## 8. Caching Strategy

- Use HTTP caching headers for monitoring results
- Cache code analysis results for identical code
- Implement Redis for distributed caching

## Tips

- Always include `Content-Type: application/json` header
- Code analysis works best with 5-10KB code snippets
- URL monitoring timeout is 30 seconds
- Bulk operations are processed in parallel
