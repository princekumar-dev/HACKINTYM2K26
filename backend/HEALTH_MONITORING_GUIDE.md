# Server Health & Load Balancing API Guide

This guide explains the new **Server Health Monitoring** and **Load Balancing** system that prevents crashes and ensures smooth server performance.

## 🎯 Overview

This system monitors your servers (like Amazon during sales events) and:
- ✅ Detects when servers are overloaded
- ✅ Predicts crashes before they happen
- ✅ Suggests load balancing solutions
- ✅ Tests new features for performance impact
- ✅ Ensures zero downtime and smooth performance

## 📊 API Endpoints

### Base URL
```
http://localhost:3001/api/health
```

## 1. Server Health Analysis

### Analyze Current Server Health

**Endpoint:** `POST /api/health/analyze-server`

**Purpose:** Analyze a server's current health status and predict crash risk

**Request:**
```bash
curl -X POST http://localhost:3001/api/health/analyze-server \
  -H "Content-Type: application/json" \
  -d '{
    "serverId": "server-1",
    "cpuUsage": 75,
    "memoryUsage": 68,
    "requestsPerSecond": 450,
    "averageResponseTime": 250,
    "errorRate": 1.2,
    "activeConnections": 3200,
    "diskUsage": 65,
    "networkLatency": 12
  }'
```

**Response (200 OK):**
```json
{
  "serverId": "server-1",
  "healthScore": 82,
  "status": "healthy",
  "crashRisk": 15,
  "metrics": {
    "cpu": 75,
    "memory": 68,
    "disk": 65,
    "requests": 450,
    "errors": 1.2
  },
  "suggestions": [
    "✅ Server is healthy and performing well"
  ],
  "timestamp": "2024-09-15T10:30:00.000Z"
}
```

### Scenario: High Traffic Event (Like Amazon Sale)

**Request:** Server under high load
```bash
curl -X POST http://localhost:3001/api/health/analyze-server \
  -H "Content-Type: application/json" \
  -d '{
    "serverId": "server-1",
    "cpuUsage": 92,
    "memoryUsage": 88,
    "requestsPerSecond": 2500,
    "averageResponseTime": 1800,
    "errorRate": 8.5,
    "activeConnections": 15000,
    "diskUsage": 85,
    "networkLatency": 45
  }'
```

**Response:**
```json
{
  "serverId": "server-1",
  "healthScore": 18,
  "status": "critical",
  "crashRisk": 87,
  "metrics": {
    "cpu": 92,
    "memory": 88,
    "disk": 85,
    "requests": 2500,
    "errors": 8.5
  },
  "suggestions": [
    "🚨 CRITICAL: Server crash imminent. Immediate action needed.",
    "→ Divert traffic to load balancer immediately",
    "→ Scale up to additional servers",
    "→ Implement emergency throttling",
    "⚠️ CPU usage critically high",
    "→ Optimize slow queries and algorithms",
    "→ Cache frequently accessed data",
    "→ Scale horizontally (add more servers)",
    "⚠️ Memory pressure is high",
    "→ Increase server RAM or add more instances",
    "📈 High request volume: 2500 RPS",
    "→ Consider load balancing across servers",
    "→ Implement request rate limiting"
  ],
  "timestamp": "2024-09-15T10:30:00.000Z"
}
```

## 2. Crash Prediction

### Predict Server Crash

**Endpoint:** `POST /api/health/predict-crash`

**Purpose:** Predict if server will crash and get early warning

**Request:**
```bash
curl -X POST http://localhost:3001/api/health/predict-crash \
  -H "Content-Type: application/json" \
  -d '{
    "serverId": "server-1",
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

**Response:**
```json
{
  "serverId": "server-1",
  "crashRiskScore": 78,
  "status": "critical",
  "willCrash": true,
  "recommendations": [
    "🚨 CRITICAL: Server crash imminent. Immediate action needed.",
    "→ Divert traffic to load balancer immediately",
    "→ Scale up to additional servers",
    "→ Implement emergency throttling",
    "⚠️ CPU usage critically high",
    "⚠️ Memory pressure is high",
    "📈 High request volume: 2000 RPS",
    "→ Consider load balancing across servers"
  ],
  "timestamp": "2024-09-15T10:30:00.000Z"
}
```

## 3. Load Simulation

### Simulate High Load

**Endpoint:** `POST /api/health/simulate-high-load`

**Purpose:** Test how server performs under higher traffic (like during sale event)

**Request:**
```bash
curl -X POST http://localhost:3001/api/health/simulate-high-load \
  -H "Content-Type: application/json" \
  -d '{
    "metrics": {
      "serverId": "server-1",
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

**Response:** (What happens if traffic increases by 3x)
```json
{
  "serverId": "server-1",
  "currentLoad": 100,
  "simulatedLoad": 300,
  "simulatedMetrics": {
    "cpuUsage": 100,
    "memoryUsage": 100,
    "requestsPerSecond": 1500,
    "averageResponseTime": 900,
    "errorRate": 1.5,
    "activeConnections": 6000,
    "diskUsage": 60,
    "networkLatency": 45
  },
  "estimatedResponseTime": 900,
  "estimatedErrorRate": 1.5,
  "willCrash": true,
  "timeUntilCrash": 5,
  "crashRiskScore": 92,
  "recommendations": [
    "🚨 This load level would cause crash",
    "SOLUTION: Implement load balancing to 2-3 servers",
    "ACTION: Add auto-scaling rules",
    "TIMELINE: Activate immediately when load >= 1.5x",
    "CAPACITY: Use 3 servers for this traffic level"
  ],
  "timestamp": "2024-09-15T10:30:00.000Z"
}
```

## 4. Load Balancing Suggestions

### Get Load Balancing Recommendations

**Endpoint:** `POST /api/health/load-balancing-suggestions`

**Purpose:** Get suggestions for balancing traffic across servers

**Request:**
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
    },
    {
      "serverId": "server-3",
      "cpuUsage": 55,
      "memoryUsage": 48,
      "requestsPerSecond": 450,
      "healthScore": 78,
      "crashRisk": 12,
      "activeConnections": 3000
    }
  ]'
```

**Response:**
```json
{
  "summary": {
    "totalServers": 3,
    "stressedServers": 1,
    "healthyServers": 2,
    "action": "Redistribute load to healthier servers"
  },
  "serverSuggestions": [
    {
      "serverId": "server-1",
      "currentLoad": 88,
      "recommendedAction": "URGENT: Move 50% traffic to server-2, server-3",
      "priority": "critical",
      "estimatedImpact": "Reduce crash risk from 82% to ~30%",
      "suggestions": [
        "🔴 CPU Critical: Immediate load shedding required",
        "→ Move requests to: server-2, server-3",
        "📈 High RPS (1800): Load balance aggressively",
        "→ Split traffic across available servers",
        "🔧 Recommended: Failover to server-2 and server-3",
        "   Expected time: 1.5 minutes"
      ],
      "targetServers": ["server-2", "server-3"],
      "expectedLoadReduction": 900,
      "implementationTime": 1.5,
      "riskLevel": "high"
    }
  ],
  "globalRecommendations": [
    "📊 Cluster Status:",
    "   Average Health: 64% (Fair)",
    "   Average Crash Risk: 34%",
    "⚠️ Action Required: 1 server(s) under stress",
    "   Priority: critical"
  ],
  "timestamp": "2024-09-15T10:30:00.000Z"
}
```

## 5. Scaling Recommendations

### Suggest Infrastructure Scaling

**Endpoint:** `POST /api/health/suggest-scaling`

**Purpose:** Recommend how much to scale infrastructure

**Request:**
```bash
curl -X POST http://localhost:3001/api/health/suggest-scaling \
  -H "Content-Type: application/json" \
  -d '{
    "totalServers": 2,
    "averageLoad": 65,
    "peakLoad": 92,
    "trafficGrowthRate": 15
  }'
```

**Response:**
```json
{
  "currentState": {
    "servers": 2,
    "averageLoad": 65,
    "peakLoad": 92
  },
  "recommendations": [
    "🟢 Scale up to 5-7 servers",
    "   Expected: Handle 2x traffic",
    "⚡ High growth rate (15%/hour): Auto-scaling recommended"
  ],
  "scalingActions": [
    "Immediately provision 1 new server(s)",
    "Enable auto-scaling rules",
    "Set threshold at 82% load"
  ],
  "timeline": {
    "0-15 min": "Provision new instances",
    "15-30 min": "Configure & deploy to new instances",
    "30-45 min": "Run health checks",
    "45-60 min": "Begin gradual traffic shift"
  },
  "estimatedCost": "2 additional server hours"
}
```

## 6. Feature Load Testing

### Test New Feature for Performance Impact

**Endpoint:** `POST /api/health/test-feature-load`

**Purpose:** Test if a new feature will crash servers

**Request:**
```bash
curl -X POST http://localhost:3001/api/health/test-feature-load \
  -H "Content-Type: application/json" \
  -d '{
    "featureName": "new-recommendation-engine",
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

**Response:**
```json
{
  "featureName": "new-recommendation-engine",
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
  },
  "loadTestResults": {
    "normalLoad": {
      "loadMultiplier": "1.0x",
      "baseline": {
        "cpuUsage": 45,
        "memoryUsage": 52,
        "responseTime": 300,
        "throughput": 5000
      },
      "withFeature": {
        "cpuUsage": 68,
        "memoryUsage": 72,
        "responseTime": 450,
        "throughput": 4500
      },
      "willCrash": false,
      "degradation": {
        "cpuIncrease": 23,
        "memoryIncrease": 20,
        "responseTimeIncrease": 150
      }
    },
    "mediumLoad": {
      "loadMultiplier": "1.5x",
      "withFeature": {
        "cpuUsage": 100,
        "memoryUsage": 100,
        "responseTime": 675,
        "throughput": 4500
      },
      "willCrash": false
    },
    "highLoad": {
      "loadMultiplier": "2.0x",
      "willCrash": true
    },
    "peakLoad": {
      "loadMultiplier": "3.0x",
      "willCrash": true
    }
  },
  "crashRiskScore": 35,
  "performanceDegradation": 31,
  "detectedIssues": [
    "🔴 Significant CPU increase (+23%)",
    "   Cause: Inefficient algorithm or missing optimization"
  ],
  "recommendations": [
    "⚠️ MONITOR CLOSELY after release",
    "   Action: Enable detailed metrics collection",
    "   Plan: Feature flag for quick rollback",
    "   Deploy: Canary (5%) → Staged (25%) → Full",
    "🔧 CPU Optimization Suggestions:",
    "   - Add caching layer for repeated computations",
    "   - Use async operations where possible",
    "   - Profile with flame graphs",
    "   - Consider background job processing"
  ],
  "status": "warning",
  "readyForProduction": false,
  "timestamp": "2024-09-15T10:30:00.000Z"
}
```

## 7. Compare Feature vs Baseline

### Compare Server Performance With/Without Feature

**Endpoint:** `POST /api/health/compare-with-feature`

**Request:**
```bash
curl -X POST http://localhost:3001/api/health/compare-with-feature \
  -H "Content-Type: application/json" \
  -d '{
    "baselineMetrics": {
      "serverId": "prod-1",
      "cpuUsage": 50,
      "memoryUsage": 55,
      "requestsPerSecond": 1000,
      "averageResponseTime": 200,
      "errorRate": 0.2,
      "activeConnections": 3000,
      "diskUsage": 60,
      "networkLatency": 10
    },
    "newFeatureImpact": {
      "cpuIncrease": 15,
      "memoryIncrease": 12,
      "responseTimeIncrease": 50
    }
  }'
```

**Response:**
```json
{
  "baseline": {
    "serverId": "prod-1",
    "healthScore": 92,
    "status": "healthy",
    "crashRisk": 5,
    "metrics": {...}
  },
  "withFeature": {
    "serverId": "prod-1",
    "healthScore": 78,
    "status": "healthy",
    "crashRisk": 20,
    "metrics": {...}
  },
  "impact": {
    "healthScoreDifference": 14,
    "crashRiskIncrease": 15,
    "safeToRelease": true,
    "recommendations": [
      "✅ SAFE TO RELEASE",
      "DEPLOYMENT: Can proceed normally",
      "MONITORING: Standard monitoring sufficient"
    ]
  },
  "timestamp": "2024-09-15T10:30:00.000Z"
}
```

## 8. Random Feature Monitoring

### Randomly Monitor Feature During Production

**Endpoint:** `POST /api/health/feature-random-monitoring`

**Purpose:** Continuously test features randomly to catch issues

**Request:**
```bash
curl -X POST http://localhost:3001/api/health/feature-random-monitoring \
  -H "Content-Type: application/json" \
  -d '{
    "featureName": "new-search-algorithm"
  }'
```

**Response:**
```json
{
  "featureName": "new-search-algorithm",
  "timestamp": "2024-09-15T10:30:00.000Z",
  "randomLoadTest": "2x load simulation",
  "detectedIssues": [
    "Spike in error rate detected",
    "Response time degradation",
    "High CPU usage detected"
  ],
  "status": "warning",
  "action": "Further monitoring recommended",
  "suggestions": [
    "→ Check application logs for errors",
    "→ Check database query performance",
    "→ Profile CPU usage with flame graph"
  ]
}
```

## 📈 Real-World Use Cases

### Scenario 1: Amazon Prime Day

**Current Metrics:**
- Server 1: CPU 78%, Memory 72%, Requests 1200 RPS
- Server 2: CPU 42%, Memory 35%, Requests 300 RPS

**Analysis:**
```
Server 1 Health: 65
Server 1 Crash Risk: 35%
Recommendation: Balance load to Server 2
Expected: Reduce crash risk to 8%
```

### Scenario 2: New Holiday Feature Launch

**Before Release:**
```
Baseline CPU: 45% | Feature CPU: 68%
Baseline Memory: 52% | Feature Memory: 72%
Crash Risk: 5% → 35%
Status: Warning - Need optimization
```

**Recommendation:**
```
DEPLOY: Canary to 5% users
MONITOR: Real-time alerts
ROLLBACK: Feature flag enabled
```

### Scenario 3: Black Friday Surge

**Load Simulation Results:**
```
Current: 1000 RPS (CPU 65%)
Simulated 2x: CPU would reach 95% → Crash imminent!
Simulated 3x: CPU 100% → Guaranteed crash

Solution: Add 2 more servers
Timeline: 15 minutes to production
```

## ✅ Success Indicators

Your system is working when:
- ✅ Servers stay in "healthy" status during high traffic
- ✅ Crash risk stays below 50% even during peaks
- ✅ New features are tested before release
- ✅ Load balancing prevents single server overload
- ✅ Zero unexpected downtime

## 🚀 Best Practices

1. **Monitor Continuously** - Run `analyze-server` every 30 seconds
2. **Simulate Before Events** - Use `simulate-high-load` before sales
3. **Test All Features** - Use `test-feature-load` before deployment
4. **Act on Warnings** - Respond to crash risk > 50% immediately
5. **Scale Proactively** - Use `suggest-scaling` to prepare for growth

## 📊 Metrics Legend

| Metric | Healthy | Degraded | Critical |
|--------|---------|----------|----------|
| Health Score | > 70 | 50-70 | < 50 |
| Crash Risk | < 20% | 20-50% | > 50% |
| CPU Usage | < 70% | 70-85% | > 85% |
| Memory Usage | < 75% | 75-85% | > 85% |

---

This system ensures **zero crashes** and **smooth server performance** during high-traffic events like Amazon sales!
