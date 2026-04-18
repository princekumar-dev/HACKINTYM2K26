# Architecture & Deployment Guide

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React + TSX)                   │
│                  http://localhost:5173                       │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/REST
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                   NestJS Backend API                         │
│                  http://localhost:3001                       │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │             API Controllers                            │ │
│  │  • MonitoringController                                │ │
│  │  • AnalysisController                                  │ │
│  │  • FeaturesController                                  │ │
│  └────────────────────────────────────────────────────────┘ │
│                         ↓                                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │             Core Services                              │ │
│  │  • UrlMonitoringService                                │ │
│  │  • CodeAnalysisService                                 │ │
│  │  • FeatureComparisonService                            │ │
│  └────────────────────────────────────────────────────────┘ │
│                         ↓                                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         External Services & Libraries                  │ │
│  │  • Axios (HTTP requests)                               │ │
│  │  • Babel Parser (AST parsing)                          │ │
│  │  • Node.js Runtime                                     │ │
│  └────────────────────────────────────────────────────────┘ │
└────────────────────────┬────────────────────────────────────┘
                         │ MongoDB Connection
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                    MongoDB Database                         │
│            mongodb://localhost:27017                        │
│                                                              │
│  Collections:                                               │
│  • UrlAnalysis (monitoring results)                         │
│  • CodeAnalysis (code analysis results)                     │
│  • FeatureComparison (feature comparison results)           │
└─────────────────────────────────────────────────────────────┘

External Connections:
├─ Real URLs (HTTP requests for monitoring)
├─ GitHub API (optional, for code validation)
└─ NPM Registry (optional, dependency check)
```

## Module Structure

```
backend/
├── src/
│   ├── modules/
│   │   ├── monitoring/              # URL performance monitoring
│   │   │   ├── controllers/         # REST endpoints
│   │   │   ├── services/            # Business logic
│   │   │   ├── dto/                 # Data transfer objects
│   │   │   └── monitoring.module.ts
│   │   │
│   │   ├── analysis/                # Code analysis
│   │   │   ├── controllers/         # REST endpoints
│   │   │   ├── services/            # AST parsing, metrics
│   │   │   ├── dto/                 # Data transfer objects
│   │   │   └── analysis.module.ts
│   │   │
│   │   └── features/                # Feature comparison
│   │       ├── controllers/         # REST endpoints
│   │       ├── services/            # Comparison logic
│   │       ├── dto/                 # Data transfer objects
│   │       └── features.module.ts
│   │
│   ├── database/
│   │   └── schemas/                 # MongoDB schemas
│   │       ├── url-analysis.schema.ts
│   │       ├── code-analysis.schema.ts
│   │       └── feature-comparison.schema.ts
│   │
│   ├── common/
│   │   └── config/                  # Configuration
│   │       └── config.service.ts
│   │
│   ├── app.module.ts                # Root module
│   └── main.ts                      # Entry point
│
└── Configuration files
    ├── package.json
    ├── tsconfig.json
    ├── nest-cli.json
    ├── Dockerfile
    ├── docker-compose.yml
    └── .env
```

## Data Flow

### URL Analysis Flow
```
User Input (URL)
    ↓
MonitoringController.analyzeUrl()
    ↓
UrlMonitoringService.analyzeUrl()
    ├─ HTTP Request (Axios)
    ├─ Response parsing
    ├─ Metrics calculation
    │  ├─ healthScore
    │  ├─ performanceScore
    │  └─ NetworkMetrics
    ├─ Suggestions generation
    └─ Response object
    ↓
MongoDB: Save to UrlAnalysis collection
    ↓
Return JSON Response to Frontend
```

### Code Analysis Flow
```
User Input (Code)
    ↓
AnalysisController.analyzeCode()
    ↓
CodeAnalysisService.analyzeCode()
    ├─ Parse code (Babel Parser)
    ├─ Build AST (Abstract Syntax Tree)
    ├─ Extract metrics
    │  ├─ Cyclomatic complexity
    │  ├─ Halstead complexity
    │  ├─ Function count
    │  └─ Dependencies
    ├─ Detect issues
    │  ├─ Performance issues (eval, etc)
    │  ├─ Security issues (XSS, etc)
    │  └─ Memory leaks
    ├─ Calculate scores
    │  ├─ healthScore
    │  ├─ performanceScore
    │  └─ maintainabilityScore
    └─ Generate suggestions
    ↓
MongoDB: Save to CodeAnalysis collection
    ↓
Return JSON Response to Frontend
```

### Feature Comparison Flow
```
User Input (Current Code + Proposed Code)
    ↓
FeaturesController.compareFeature()
    ↓
FeatureComparisonService.compareFeature()
    ├─ Analyze current code
    ├─ Analyze proposed code
    ├─ Extract current metrics
    ├─ Extract proposed metrics
    ├─ Calculate improvements
    │  ├─ Performance improvement
    │  ├─ Health improvement
    │  ├─ Latency improvement
    │  └─ Resource estimation
    ├─ Assess risk level
    ├─ Identify potential issues
    ├─ Generate recommendations
    ├─ Estimate implementation time
    └─ Prepare injection metadata
    ↓
MongoDB: Save to FeatureComparison collection
    ↓
Return detailed comparison with visualization data to Frontend
```

## Deployment Scenarios

### Scenario 1: Development (Local)
```
npm install
npm run start:dev
# MongoDB: localhost:27017
# API: localhost:3001
# Frontend: localhost:5173
```

### Scenario 2: Docker Compose (Recommended)
```
docker-compose up -d
# MongoDB: localhost:27017
# Backend: localhost:3001
# Mongo Express: localhost:8081
```

### Scenario 3: Production (VPS/Cloud)
```
# Setup
git clone repo
npm install
npm run build

# Environment
.env with production values
MONGODB_URI=mongodb+srv://...

# Process Management
pm2 start npm --name "api" -- run start:prod

# Reverse Proxy (Nginx)
upstream backend {
    server localhost:3001;
}

server {
    listen 80;
    server_name your-api.com;
    
    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Scenario 4: Kubernetes (Enterprise)
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hackintym2k26-api
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: api
        image: hackintym2k26-backend:latest
        ports:
        - containerPort: 3001
        env:
        - name: MONGODB_URI
          valueFrom:
            secretKeyRef:
              name: api-secrets
              key: mongodb-uri
        - name: NODE_ENV
          value: "production"
---
apiVersion: v1
kind: Service
metadata:
  name: api-service
spec:
  type: LoadBalancer
  ports:
  - port: 80
    targetPort: 3001
  selector:
    app: hackintym2k26-api
```

## Performance Optimization

### 1. Database Indexing
```javascript
// Recommended MongoDB indexes
UrlAnalysis.collection.createIndex({ url: 1, timestamp: -1 });
CodeAnalysis.collection.createIndex({ complexity: 1 });
FeatureComparison.collection.createIndex({ 
  featureName: 1,
  timestamp: -1 
});
```

### 2. Caching Strategy
```
Level 1: In-Memory Cache (Redis)
- Cache identical URL analyses for 1 hour
- Cache identical code analyses for 1 hour
- Cache dependency lists

Level 2: Browser Cache
- Set Cache-Control headers on responses
- Implement cache busting for new versions

Level 3: Database Query Optimization
- Use MongoDB aggregation pipeline
- Implement query result pagination
```

### 3. API Rate Limiting
```javascript
// Suggest rate limiting for production
Per IP: 100 requests / minute
Per endpoint: 50 requests / minute
Burst limit: 10 requests / second
```

### 4. Load Balancing
```
NGINX Load Balancer (Round Robin)
    ↓
API Server 1 (3001)
API Server 2 (3001)
API Server 3 (3001)
    ↓
MongoDB Replica Set (HA)
```

## Security Measures

### 1. Environment Variables
```
✓ Never commit .env file
✓ Use strong MongoDB credentials
✓ Implement API key authentication
✓ Use HTTPS in production
```

### 2. Input Validation
```
✓ URL format validation
✓ Code length limits
✓ SQL injection prevention
✓ XSS prevention in code analysis
```

### 3. CORS Configuration
```javascript
// Only allow frontend origins
cors({
  origin: ['https://app.example.com', 'http://localhost:5173'],
  credentials: true
})
```

### 4. API Authentication (Optional)
```javascript
// Add JWT or API key authentication
@UseGuards(AuthGuard('jwt'))
@Post('analyze-code')
async analyzeCode(@Body() dto: AnalyzeCodeDto)
```

## Monitoring & Logging

### 1. Application Logging
```bash
# Using Winston logger (add to services)
private logger = new Logger('ServiceName');

this.logger.log('Analysis started');
this.logger.error('Error occurred', error);
```

### 2. Performance Monitoring
```bash
# New Relic / DataDog Integration
track latency metrics
track error rates
monitor database connections
```

### 3. Health Check Endpoint (Add to backend)
```
GET /api/health
Returns: { status: 'ok', mongodb: 'connected' }
```

## Scaling Strategy

### Horizontal Scaling
```
Load Balancer
    ↓
[API Instance 1] [API Instance 2] [API Instance 3]
    ↓ ↓ ↓
[MongoDB Cluster - Sharded]
```

### Vertical Scaling
```
Upgrade server:
- CPU cores
- RAM
- Network bandwidth
- Disk I/O
```

### Database Scaling
```
MongoDB:
- Sharding by featureName/url
- Read replicas
- Automated backups
```

## Disaster Recovery

### Backup Strategy
```bash
# Daily MongoDB backups
mongodump --uri "mongodb://..." --out /backups/$(date +%Y%m%d)

# Store in S3/GCS
aws s3 sync /backups s3://backup-bucket/

# Retention: 30 days
```

### Recovery Procedures
```bash
# Restore from backup
mongorestore --uri "mongodb://..." /backups/20240915
```

## Cost Optimization

### Resource Allocation
```
Development: t2.micro (256MB RAM, 1 CPU)
Staging: t2.small (1GB RAM, 1 CPU)
Production: t2.medium (4GB RAM, 2 CPUs)
```

### Database
```
Development: LocalMongo or MongoDB Atlas Free
Production: MongoDB Atlas M10+ (3 node replica set)
```

### CI/CD Pipeline
```
GitHub Actions (free with public repo)
- Test on every push
- Build Docker image
- Deploy to staging
- Manual production deployment
```

## Troubleshooting Guide

| Issue | Solution |
|-------|----------|
| High memory usage | Check for memory leaks in code analysis |
| Slow database queries | Add indexes, implement caching |
| CORS errors | Update FRONTEND_URL in .env |
| MongoDB connection timeout | Check network/firewall, increase timeout |
| API rate limiting | Implement queue system, add rate limiting |

## Next Steps

1. ✅ Backend created and documented
2. → Deploy to development environment
3. → Connect frontend to backend
4. → Add authentication & authorization
5. → Set up CI/CD pipeline
6. → Deploy to staging
7. → Performance testing
8. → Deploy to production
