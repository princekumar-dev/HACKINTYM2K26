# Testing & Validation Guide

Complete guide to test and validate the health monitoring system works correctly.

## ✅ Pre-Deployment Validation

### 1. System Startup Check

**Verify Backend Starts:**
```bash
cd backend
npm install  # First time only
npm run start:dev
```

Expected output:
```
[INFO] NestJS Application started
[INFO] Health Module initialized
[INFO] Listening on port 3001
```

### 2. Health Check Endpoint

**Test basic connectivity:**
```bash
curl http://localhost:3001/api/health/health-check
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-09-15T10:30:00.000Z"
}
```

**✅ PASS:** You got status 200 with `status: "ok"`

---

## 🧪 Unit Tests

### Run Existing Tests

```bash
npm run test
```

Expected output:
```
Test Suites: X passed
Tests: Y passed, Z total
```

### Create Additional Tests

```bash
cat > src/modules/health/__tests__/health.service.spec.ts << 'EOF'
import { Test, TestingModule } from '@nestjs/testing';
import { ServerHealthService } from '../server-health.service';
import { getModelToken } from '@nestjs/mongoose';
import { ServerHealth } from '../server-health.schema';

describe('ServerHealthService', () => {
  let service: ServerHealthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServerHealthService,
        {
          provide: getModelToken(ServerHealth.name),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ServerHealthService>(ServerHealthService);
  });

  it('should analyze healthy server', async () => {
    const result = await service.analyzeServerHealth({
      serverId: 'test-1',
      cpuUsage: 45,
      memoryUsage: 52,
      requestsPerSecond: 500,
      averageResponseTime: 300,
      errorRate: 0.5,
      activeConnections: 2000,
      diskUsage: 60,
      networkLatency: 15,
    });

    expect(result.status).toBe('healthy');
    expect(result.healthScore).toBeGreaterThan(70);
    expect(result.crashRisk).toBeLessThan(20);
  });

  it('should detect critical server', async () => {
    const result = await service.analyzeServerHealth({
      serverId: 'test-1',
      cpuUsage: 95,
      memoryUsage: 92,
      requestsPerSecond: 5000,
      averageResponseTime: 5000,
      errorRate: 12,
      activeConnections: 20000,
      diskUsage: 95,
      networkLatency: 100,
    });

    expect(result.status).toBe('critical');
    expect(result.healthScore).toBeLessThan(50);
    expect(result.crashRisk).toBeGreaterThan(70);
  });
});
EOF

npm run test -- health.service.spec.ts
```

---

## 🔨 Manual API Testing

### Test Scenario 1: Healthy Server

**Step 1: Send healthy metrics**
```bash
curl -X POST http://localhost:3001/api/health/analyze-server \
  -H "Content-Type: application/json" \
  -d '{
    "serverId": "healthy-server",
    "cpuUsage": 35,
    "memoryUsage": 42,
    "requestsPerSecond": 300,
    "averageResponseTime": 150,
    "errorRate": 0.1,
    "activeConnections": 1500,
    "diskUsage": 45,
    "networkLatency": 8
  }'
```

**Expected Response:**
```json
{
  "serverId": "healthy-server",
  "healthScore": 95,
  "status": "healthy",
  "crashRisk": 3,
  "suggestions": ["✅ Server is healthy and performing well"],
  "timestamp": "2024-09-15T10:30:00.000Z"
}
```

**✅ PASS:** Health score > 80 and status is "healthy"

---

### Test Scenario 2: Degraded Server

**Step 2: Send degraded metrics**
```bash
curl -X POST http://localhost:3001/api/health/analyze-server \
  -H "Content-Type: application/json" \
  -d '{
    "serverId": "degraded-server",
    "cpuUsage": 72,
    "memoryUsage": 68,
    "requestsPerSecond": 1200,
    "averageResponseTime": 580,
    "errorRate": 2.5,
    "activeConnections": 5500,
    "diskUsage": 72,
    "networkLatency": 28
  }'
```

**Expected Response:**
```json
{
  "serverId": "degraded-server",
  "healthScore": 68,
  "status": "degraded",
  "crashRisk": 38,
  "suggestions": [
    "⚠️ Server health degraded. Monitor closely.",
    "→ CPU is elevated",
    "→ Memory pressure increasing",
    "→ Response times climbing",
    "📈 High request volume: 1200 RPS"
  ]
}
```

**✅ PASS:** Status is "degraded" and crash risk is 20-50%

---

### Test Scenario 3: Critical Server

**Step 3: Send critical metrics**
```bash
curl -X POST http://localhost:3001/api/health/analyze-server \
  -H "Content-Type: application/json" \
  -d '{
    "serverId": "critical-server",
    "cpuUsage": 91,
    "memoryUsage": 87,
    "requestsPerSecond": 2500,
    "averageResponseTime": 2200,
    "errorRate": 9.2,
    "activeConnections": 14000,
    "diskUsage": 88,
    "networkLatency": 52
  }'
```

**Expected Response:**
```json
{
  "serverId": "critical-server",
  "healthScore": 22,
  "status": "critical",
  "crashRisk": 85,
  "suggestions": [
    "🚨 CRITICAL: Server crash imminent. Immediate action needed.",
    "→ Divert traffic to load balancer immediately",
    "→ Scale up to additional servers",
    "→ Implement emergency throttling"
  ]
}
```

**✅ PASS:** Status is "critical" and crash risk > 70%

---

### Test Scenario 4: Load Balancing

**Step 4: Test load balancing suggestions**
```bash
curl -X POST http://localhost:3001/api/health/load-balancing-suggestions \
  -H "Content-Type: application/json" \
  -d '[
    {
      "serverId": "server-1",
      "cpuUsage": 88,
      "memoryUsage": 85,
      "requestsPerSecond": 1800,
      "healthScore": 25,
      "crashRisk": 82,
      "activeConnections": 10000
    },
    {
      "serverId": "server-2",
      "cpuUsage": 42,
      "memoryUsage": 35,
      "requestsPerSecond": 300,
      "healthScore": 89,
      "crashRisk": 8,
      "activeConnections": 2500
    }
  ]'
```

**Expected Response:**
```json
{
  "summary": {
    "totalServers": 2,
    "stressedServers": 1,
    "healthyServers": 1,
    "action": "Redistribute load to healthier servers"
  },
  "serverSuggestions": [
    {
      "serverId": "server-1",
      "priority": "critical",
      "recommendedAction": "URGENT: Move 50% traffic to server-2",
      "targetServers": ["server-2"],
      "expectedLoadReduction": 900
    }
  ]
}
```

**✅ PASS:** Identifies stressed server and recommends action

---

### Test Scenario 5: Feature Load Testing

**Step 5: Test new feature impact**
```bash
curl -X POST http://localhost:3001/api/health/test-feature-load \
  -H "Content-Type: application/json" \
  -d '{
    "featureName": "recommendation-engine",
    "baselineMetrics": {
      "cpuUsage": 45,
      "memoryUsage": 52,
      "responseTime": 300,
      "throughput": 5000
    },
    "featureMetrics": {
      "cpuUsage": 68,
      "memoryUsage": 72,
      "responseTime": 450,
      "throughput": 4500
    }
  }'
```

**Expected Response:**
```json
{
  "featureName": "recommendation-engine",
  "crashRiskScore": 35,
  "performanceDegradation": 31,
  "status": "warning",
  "readyForProduction": false,
  "recommendations": [
    "⚠️ MONITOR CLOSELY after release",
    "🔧 CPU Optimization Suggestions"
  ]
}
```

**✅ PASS:** Returns crash risk score and readiness status

---

### Test Scenario 6: Crash Prediction

**Step 6: Test crash prediction**
```bash
curl -X POST http://localhost:3001/api/health/predict-crash \
  -H "Content-Type: application/json" \
  -d '{
    "serverId": "test-crash",
    "cpuUsage": 88,
    "memoryUsage": 86,
    "requestsPerSecond": 2000,
    "averageResponseTime": 1500,
    "errorRate": 7.2,
    "activeConnections": 12000,
    "diskUsage": 82,
    "networkLatency": 35
  }'
```

**Expected Response:**
```json
{
  "serverId": "test-crash",
  "crashRiskScore": 78,
  "status": "critical",
  "willCrash": true,
  "recommendations": ["🚨 CRITICAL: Server crash imminent..."]
}
```

**✅ PASS:** Correctly predicts crash risk

---

### Test Scenario 7: High Load Simulation

**Step 7: Test with 3x traffic**
```bash
curl -X POST http://localhost:3001/api/health/simulate-high-load \
  -H "Content-Type: application/json" \
  -d '{
    "metrics": {
      "serverId": "test-sim",
      "cpuUsage": 45,
      "memoryUsage": 52,
      "requestsPerSecond": 500,
      "averageResponseTime": 300,
      "errorRate": 0.5,
      "activeConnections": 2000,
      "diskUsage": 60,
      "networkLatency": 15
    },
    "loadMultiplier": 3
  }'
```

**Expected Response:**
```json
{
  "simulatedLoad": 300,
  "simulatedMetrics": {
    "cpuUsage": 100,
    "requestsPerSecond": 1500
  },
  "willCrash": true,
  "crashRiskScore": 92,
  "recommendations": ["SOLUTION: Implement load balancing to 2-3 servers"]
}
```

**✅ PASS:** Correctly simulates higher load

---

## 📊 Performance Testing

### Load Test the Health API Itself

```bash
# Install Apache Bench
# macOS: brew install httpd
# Linux: sudo apt-get install apache2-utils
# Windows: choco install ab

# Run 1000 requests with 100 concurrent
ab -n 1000 -c 100 http://localhost:3001/api/health/health-check
```

Expected results:
```
Requests per second: > 500
Failed requests: 0
Average time per request: < 100ms
```

**✅ PASS:** API handles load well

---

### Database Performance

```bash
# Check MongoDB connection
mongo mongodb://localhost:27017/health_monitoring --eval "db.serverhealth.count()"
```

Expected output:
```
X    # Number of health records stored
```

**✅ PASS:** MongoDB is storing health data

---

## 🔍 Integration Testing

### Test Full Monitoring Loop

Create a test file:
```bash
cat > monitor-test.js << 'EOF'
const axios = require('axios');

const api = axios.create({
  baseURL: 'http://localhost:3001/api/health'
});

async function testMonitoringLoop() {
  console.log('🔄 Testing monitoring loop...');
  
  // Simulate 5 monitoring cycles
  for (let i = 1; i <= 5; i++) {
    console.log(`\n📊 Cycle ${i}:`);
    
    // Healthy server
    const health1 = await api.post('/analyze-server', {
      serverId: 'prod-1',
      cpuUsage: 40 + Math.random() * 20,
      memoryUsage: 50 + Math.random() * 20,
      requestsPerSecond: 1000,
      averageResponseTime: 300,
      errorRate: 0.5,
      activeConnections: 3000,
      diskUsage: 60,
      networkLatency: 15
    });
    
    console.log(`  Server 1: ${health1.data.status} (score: ${health1.data.healthScore})`);
    
    // Wait 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n✅ Monitoring loop test completed');
}

testMonitoringLoop().catch(console.error);
EOF

node monitor-test.js
```

Expected output:
```
🔄 Testing monitoring loop...

📊 Cycle 1:
  Server 1: healthy (score: 88)

📊 Cycle 2:
  Server 1: healthy (score: 85)

... (3 more cycles)

✅ Monitoring loop test completed
```

**✅ PASS:** Continuous monitoring works

---

## 🚨 Alerting Test

### Test Alert Generation

```bash
curl -X POST http://localhost:3001/api/health/analyze-server \
  -H "Content-Type: application/json" \
  -d '{
    "serverId": "alert-test",
    "cpuUsage": 92,
    "memoryUsage": 88,
    "requestsPerSecond": 2500,
    "averageResponseTime": 1800,
    "errorRate": 8.5,
    "activeConnections": 15000,
    "diskUsage": 85,
    "networkLatency": 45
  }' | jq '.suggestions | length'
```

Expected: Suggestions array has recommendations

**✅ PASS:** Alert system generates recommendations

---

## ✨ Edge Cases

### Test 1: Zero Metrics
```bash
curl -X POST http://localhost:3001/api/health/analyze-server \
  -H "Content-Type: application/json" \
  -d '{
    "serverId": "zero-test",
    "cpuUsage": 0,
    "memoryUsage": 0,
    "requestsPerSecond": 0,
    "averageResponseTime": 0,
    "errorRate": 0,
    "activeConnections": 0,
    "diskUsage": 0,
    "networkLatency": 0
  }'
```

**✅ PASS:** Should return status "idle" or similar

### Test 2: Max Metrics
```bash
curl -X POST http://localhost:3001/api/health/analyze-server \
  -H "Content-Type: application/json" \
  -d '{
    "serverId": "max-test",
    "cpuUsage": 100,
    "memoryUsage": 100,
    "requestsPerSecond": 10000,
    "averageResponseTime": 5000,
    "errorRate": 100,
    "activeConnections": 100000,
    "diskUsage": 100,
    "networkLatency": 1000
  }'
```

**✅ PASS:** Should return status "critical"

### Test 3: Invalid Input
```bash
curl -X POST http://localhost:3001/api/health/analyze-server \
  -H "Content-Type: application/json" \
  -d '{
    "serverId": "invalid-test",
    "cpuUsage": -10,
    "memoryUsage": 150
  }'
```

**✅ PASS:** Should return 400 with validation error

---

## 📊 Test Summary Checklist

Run this before deployment:

```
✅ Health Check Endpoint
  - [ ] Returns 200 OK
  - [ ] Status is "ok"

✅ Server Analysis
  - [ ] Healthy server detected (score > 70)
  - [ ] Degraded server detected (score 50-70)
  - [ ] Critical server detected (score < 50)

✅ Load Balancing
  - [ ] Suggests target servers
  - [ ] Calculates load reduction
  - [ ] Provides priority level

✅ Feature Testing
  - [ ] Calculates crash risk
  - [ ] Provides recommendations
  - [ ] Sets readiness status

✅ Load Simulation
  - [ ] Scales metrics correctly
  - [ ] Predicts crash under load
  - [ ] Suggests scaling actions

✅ Edge Cases
  - [ ] Zero metrics handled
  - [ ] Max metrics handled
  - [ ] Invalid input rejected

✅ Performance
  - [ ] API responds < 100ms
  - [ ] Handles 100+ concurrent
  - [ ] Database stores data

✅ Integration
  - [ ] Continuous monitoring works
  - [ ] Alerts generated
  - [ ] Recommendations provided
```

---

## 🚀 Ready for Production

When all tests pass:

```bash
# 1. Run all tests
npm run test

# 2. Build for production
npm run build

# 3. Start production
npm run start:prod

# 4. Verify health
curl http://localhost:3001/api/health/health-check

# 5. Monitor logs
docker logs -f health-backend
```

**Production Deployment Checklist:**
- [ ] All automated tests pass
- [ ] Manual testing completed
- [ ] Load testing successful
- [ ] Edge cases handled
- [ ] Documentation reviewed
- [ ] Team trained
- [ ] Monitoring configured
- [ ] Alerts connected
- [ ] Rollback plan ready

---

**Congratulations!** Your health monitoring system is production-ready.
