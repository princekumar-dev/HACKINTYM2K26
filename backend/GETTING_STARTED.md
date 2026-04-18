# GETTING STARTED - Complete Setup Guide

Welcome to the HackintyM2K26 Backend! This is your comprehensive guide to get everything running.

## 🚀 Quick Start (5 minutes)

### Step 1: Prerequisites
- Node.js 16+ ([Download](https://nodejs.org))
- MongoDB ([Local](https://docs.mongodb.com/manual/installation/) or [Atlas](https://www.mongodb.com/cloud/atlas))
- Git

### Step 2: Clone & Install
```bash
cd backend
npm install
cp .env.example .env
```

### Step 3: Configure
Edit `.env`:
```
PORT=3001
MONGODB_URI=mongodb://localhost:27017/hackintym2k26
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### Step 4: Run
```bash
# Development mode (with hot reload)
npm run start:dev

# Or production build
npm run build
npm run start:prod
```

### Step 5: Test
Open browser: `http://localhost:3001/api/docs`

## 📋 What's Inside

### 1. URL Monitoring Service
Analyzes website performance with:
- Real HTTP requests
- Latency & latency metrics
- Health scoring (0-100)
- Performance scoring (0-100)
- Uptime tracking
- Error rate analysis
- Automatic suggestions

```bash
curl -X POST http://localhost:3001/api/monitoring/analyze-url \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'
```

### 2. Code Analysis Service
Deep code analysis using AST parsing:
- Cyclomatic complexity
- Halstead complexity metrics
- Code health score
- Performance score
- Maintainability index
- Issue detection (security, performance, memory)
- Automatic improvements suggestions
- Dependency tracking

```bash
curl -X POST http://localhost:3001/api/analysis/analyze-code \
  -H "Content-Type: application/json" \
  -d '{
    "code": "function test() { return 42; }",
    "language": "javascript"
  }'
```

### 3. Feature Comparison Service
Compare and inject new features:
- Performance impact simulation
- Risk assessment (low/medium/high)
- Memory & CPU usage estimation
- Affected components detection
- Required changes identification
- Implementation time estimation
- Improvement metrics (5 dimensions)
- Detailed recommendations

```bash
curl -X POST http://localhost:3001/api/features/compare \
  -H "Content-Type: application/json" \
  -d '{
    "featureName": "new-cache",
    "currentCode": "...",
    "proposedCode": "...",
    "affectedComponents": ["Component1"]
  }'
```

## 📚 Documentation Files

### Essential Docs
- **README.md** - Project overview & features
- **QUICKSTART.md** - 3 ways to run the backend
- **API_EXAMPLES.md** - All endpoints with real examples

### Integration
- **FRONTEND_INTEGRATION.md** - Connect React frontend to backend

### Advanced
- **ARCHITECTURE.md** - System design & deployment strategies

## 🏗️ Project Structure

```
backend/
├── src/
│   ├── modules/
│   │   ├── monitoring/     # URL monitoring
│   │   ├── analysis/       # Code analysis
│   │   └── features/       # Feature comparison
│   ├── database/           # MongoDB schemas
│   ├── common/             # Shared services
│   ├── app.module.ts       # Root module
│   └── main.ts             # Entry point
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript config
├── docker-compose.yml      # Docker setup
└── .env.example            # Environment template
```

## 🔌 API Endpoints

### Monitoring
```
POST /api/monitoring/analyze-url      # Analyze single URL
POST /api/monitoring/bulk-analyze     # Analyze multiple URLs
```

### Analysis
```
POST /api/analysis/analyze-code       # Analyze code snippet
POST /api/analysis/batch-analyze      # Analyze multiple snippets
```

### Features
```
POST /api/features/compare              # Compare feature implementations
POST /api/features/simulate-injection   # Simulate feature injection
```

Full documentation at: `http://localhost:3001/api/docs`

## 🐳 Using Docker

### Single Command Startup
```bash
docker-compose up -d
```

This starts:
- ✅ Backend on port 3001
- ✅ MongoDB on port 27017
- ✅ Mongo Express UI on port 8081 (admin/password)

### Stop Services
```bash
docker-compose down
```

## 🧪 Testing

```bash
# Run all tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:cov
```

## 💡 Common Tasks

### Analyze a URL
```javascript
const response = await fetch('http://localhost:3001/api/monitoring/analyze-url', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ url: 'https://github.com' })
});
const data = await response.json();
console.log(data.healthScore, data.performanceScore);
```

### Detect Code Issues
```javascript
const response = await fetch('http://localhost:3001/api/analysis/analyze-code', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    code: 'function bad() { eval("x"); }',
    language: 'javascript'
  })
});
const data = await response.json();
console.log(data.issues);  // ['Security issue: Potential XSS vulnerability detected']
```

### Compare Features
```javascript
const response = await fetch('http://localhost:3001/api/features/compare', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    featureName: 'cache-v2',
    currentCode: 'const x = slow();',
    proposedCode: 'const cache = {}; const x = cache.get() || slow();',
    affectedComponents: ['DataService']
  })
});
const data = await response.json();
console.log(data.improvements);  // Performance increased by 25%
```

## 🔧 Development Commands

```bash
# Start development server (hot reload)
npm run start:dev

# Build for production
npm run build

# Start production server
npm run start:prod

# Run linter
npm run lint

# Format code
npm run format

# Run tests
npm run test
npm run test:watch
npm run test:cov

# Debug
npm run start:debug
```

## ⚙️ Environment Variables

```env
PORT=3001                                           # Server port
MONGODB_URI=mongodb://localhost:27017/hackintym     # MongoDB connection
NODE_ENV=development                                # Environment
FRONTEND_URL=http://localhost:5173                  # Frontend URL (CORS)
```

For MongoDB Atlas:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/hackintym2k26
```

## 🚨 Troubleshooting

### MongoDB Won't Connect
```bash
# Windows: Start MongoDB
mongod

# macOS: Start MongoDB
brew services start mongodb-community

# Or use MongoDB Atlas (cloud version)
```

### Port 3001 Already in Use
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :3001
kill -9 <PID>
```

### Dependencies Installation Issues
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### CORS Errors
Check `.env`:
```env
FRONTEND_URL=http://localhost:5173
```

## 📊 API Response Examples

### Health Check
```json
{
  "url": "https://github.com",
  "statusCode": 200,
  "latency": 342,
  "healthScore": 95,
  "performanceScore": 88,
  "uptime": 99.9,
  "errorRate": 1
}
```

### Code Analysis
```json
{
  "complexity": 3,
  "healthScore": 85,
  "performanceScore": 78,
  "maintainabilityScore": 82,
  "issues": ["Remove console.log statements"],
  "suggestions": ["Simplify conditional logic"]
}
```

### Feature Comparison
```json
{
  "featureName": "cache-v2",
  "impactLevel": "high",
  "riskLevel": "low",
  "improvements": {
    "performance": 25,
    "health": 15,
    "latency": 30
  }
}
```

## 🌐 Frontend Integration

Connect your React frontend:

1. Install axios:
```bash
npm install axios
```

2. Create API client (`src/services/api.ts`):
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001/api'
});

export const analyzeUrl = (url) => 
  api.post('/monitoring/analyze-url', { url });

export default api;
```

3. Use in component:
```typescript
import { analyzeUrl } from '@/services/api';

const [result, setResult] = useState(null);

const handleAnalyze = async (url) => {
  const data = await analyzeUrl(url);
  setResult(data);
};
```

See [FRONTEND_INTEGRATION.md](FRONTEND_INTEGRATION.md) for complete guide.

## 📈 Performance Optimization

### Caching
- Implement Redis for expensive operations
- Cache identical analyses for 1 hour

### Database Indexing
```javascript
db.urlanalyses.createIndex({ url: 1, timestamp: -1 });
db.codeanalyses.createIndex({ complexity: 1 });
```

### Rate Limiting
```javascript
// Add rate limiting middleware
limit: 100 requests per minute per IP
```

## 🔐 Security Checklist

- [ ] Use HTTPS in production
- [ ] Secure MongoDB with authentication
- [ ] Implement API key or JWT auth
- [ ] Validate all inputs
- [ ] Use CORS appropriately
- [ ] Add rate limiting
- [ ] Sanitize code before analysis
- [ ] Log security events

## 🎯 Next Steps

1. ✅ Backend running
2. → Read [FRONTEND_INTEGRATION.md](FRONTEND_INTEGRATION.md)
3. → Connect frontend to backend
4. → Add database persistence
5. → Implement authentication
6. → Deploy to production
7. → Set up monitoring
8. → Add more analysis features

## 📞 Support

- 📖 [README.md](README.md) - Full documentation
- 📚 [API_EXAMPLES.md](API_EXAMPLES.md) - All endpoints with examples
- 🏗️ [ARCHITECTURE.md](ARCHITECTURE.md) - System design
- ⚡ [QUICKSTART.md](QUICKSTART.md) - Quick setup options
- 🔗 [FRONTEND_INTEGRATION.md](FRONTEND_INTEGRATION.md) - Frontend connection

## 📝 License

MIT - Free to use and modify

## 🎉 Ready?

```bash
npm run start:dev
# Then open: http://localhost:3001/api/docs
```

Happy coding! 🚀
