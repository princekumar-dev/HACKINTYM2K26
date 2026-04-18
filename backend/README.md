# HackintyM2K26 Backend API

A comprehensive performance monitoring and code analysis backend built with NestJS, MongoDB, and real HTTP monitoring.

## Features

### 📊 URL Monitoring
- Real HTTP requests to analyze website performance
- Metrics: latency, health score, performance score, uptime tracking
- Detailed network metrics (DNS, TCP, TLS timing)
- Automated suggestions for performance improvements
- Bulk URL analysis support

### 🔍 Code Analysis
- AST parsing with Babel for deep code analysis
- Complexity metrics (cyclomatic, Halstead)
- Code health, performance, and maintainability scores
- Issue detection and suggestions
- Dependency tracking
- Comment ratio analysis

### 🚀 Feature Comparison & Injection
- Compare current vs. proposed code implementations
- Performance impact prediction
- Risk assessment for feature injection
- Memory and CPU usage estimation
- Required changes identification
- Implementation time estimation
- Detailed recommendations and impact analysis

### 📈 Simulation & Analysis
- Complete feature injection simulation
- System performance impact analysis
- New feature usage prediction
- Comparison of metrics before/after injection

## Project Structure

```
backend/
├── src/
│   ├── modules/
│   │   ├── monitoring/          # URL monitoring
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   ├── dto/
│   │   │   └── monitoring.module.ts
│   │   ├── analysis/            # Code analysis
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   ├── dto/
│   │   │   └── analysis.module.ts
│   │   └── features/            # Feature comparison
│   │       ├── controllers/
│   │       ├── services/
│   │       ├── dto/
│   │       └── features.module.ts
│   ├── database/
│   │   └── schemas/             # MongoDB schemas
│   ├── common/
│   │   └── config/              # Configuration services
│   ├── app.module.ts
│   └── main.ts
├── test/
├── package.json
├── tsconfig.json
└── .env.example
```

## Installation

### Prerequisites
- Node.js 16+
- MongoDB (local or Atlas)
- npm or yarn

### Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Configure environment:**
```bash
cp .env.example .env
```

Edit `.env` with your settings:
```
PORT=3001
MONGODB_URI=mongodb://localhost:27017/hackintym2k26
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

3. **Start MongoDB** (if using local):
```bash
mongod
```

## Running

### Development Mode
```bash
npm run start:dev
```

### Production Build
```bash
npm run build
npm run start:prod
```

## API Documentation

### Swagger/OpenAPI
Once running, visit: `http://localhost:3001/api/docs`

### Monitoring Endpoints

**POST `/api/monitoring/analyze-url`**
```json
{
  "url": "https://example.com"
}
```

Response:
```json
{
  "url": "https://example.com",
  "statusCode": 200,
  "latency": 342,
  "healthScore": 95,
  "performanceScore": 88,
  "responseTime": 342,
  "uptime": 99.9,
  "errorRate": 1,
  "suggestions": [...],
  "metrics": { ... },
  "timestamp": "2024-09-15T10:30:00Z"
}
```

**POST `/api/monitoring/bulk-analyze`**
```json
[
  { "url": "https://example1.com" },
  { "url": "https://example2.com" }
]
```

### Analysis Endpoints

**POST `/api/analysis/analyze-code`**
```json
{
  "code": "function test() { return 42; }",
  "language": "javascript"
}
```

Response:
```json
{
  "code": "...",
  "language": "javascript",
  "complexity": 1,
  "healthScore": 95,
  "performanceScore": 92,
  "maintainabilityScore": 98,
  "issues": [],
  "suggestions": [...],
  "lineCount": 1,
  "functionCount": 1,
  "dependencies": [],
  "metrics": { ... },
  "timestamp": "2024-09-15T10:30:00Z"
}
```

### Features Endpoints

**POST `/api/features/compare`**
```json
{
  "featureName": "new-caching-system",
  "currentCode": "// current implementation",
  "proposedCode": "// proposed implementation",
  "affectedComponents": ["CacheManager", "DataStore"]
}
```

Response:
```json
{
  "featureName": "new-caching-system",
  "currentMetrics": { ... },
  "proposedMetrics": { ... },
  "improvements": { ... },
  "impactLevel": "high",
  "recommendations": [...],
  "riskLevel": "low",
  "potentialIssues": [],
  "injectionMetadata": {
    "affectedComponents": [...],
    "requiredChanges": [...],
    "estimatedImplementationTime": 120
  },
  "timestamp": "2024-09-15T10:30:00Z"
}
```

## Services Overview

### UrlMonitoringService
- Real HTTP monitoring with detailed metrics
- Health and performance score calculation
- Automatic suggestion generation

### CodeAnalysisService
- AST-based code parsing and analysis
- Complexity calculation (cyclomatic, Halstead)
- Issue detection and code quality assessment

### FeatureComparisonService
- Comparison of code implementations
- Performance impact prediction
- Risk and implementation time estimation

## Database Schema

### UrlAnalysis
- URL monitoring results
- Health and performance metrics
- Network timing data

### CodeAnalysis
- Code analysis results
- Complexity and quality metrics
- Issues and suggestions

### FeatureComparison
- Feature comparison results
- Improvement metrics
- Risk and recommendation data

## Error Handling

All endpoints return structured error responses:
```json
{
  "statusCode": 400,
  "message": "Error message",
  "timestamp": "2024-09-15T10:30:00Z"
}
```

## Performance Considerations

- URL monitoring uses parallel requests for bulk analysis
- Code analysis is optimized for files up to 50KB
- MongoDB indexing on frequently queried fields recommended
- Implement caching for repeated analyses

## Testing

```bash
npm run test
npm run test:watch
npm run test:cov
```

## Contributing

1. Follow the existing code structure
2. Use TypeScript strict mode
3. Add tests for new features
4. Run linter before committing

```bash
npm run lint
npm run format
```

## License

MIT

## Support

For issues and feature requests, contact the development team.
