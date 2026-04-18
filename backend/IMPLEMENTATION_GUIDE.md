# Implementation Guide: Server Health Monitoring

A step-by-step guide for implementing the health monitoring system to prevent server crashes and ensure smooth performance during high-traffic events.

## 🎯 Quick Start (5 Minutes)

### 1. Start the Backend
```bash
cd backend
npm install
npm run start:dev
```

### 2. Verify It's Running
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

### 3. Test with Sample Server
```bash
curl -X POST http://localhost:3001/api/health/analyze-server \
  -H "Content-Type: application/json" \
  -d '{
    "serverId": "test-server-1",
    "cpuUsage": 45,
    "memoryUsage": 52,
    "requestsPerSecond": 500,
    "averageResponseTime": 300,
    "errorRate": 0.5,
    "activeConnections": 2000,
    "diskUsage": 60,
    "networkLatency": 15
  }'
```

You should get a response showing `healthScore: 92` and `status: "healthy"`.

---

## 📊 Integration Steps

### Step 1: Collect Server Metrics

First, get real metrics from your servers. You need to collect:

```typescript
interface ServerMetrics {
  serverId: string;           // Unique server identifier
  cpuUsage: number;           // 0-100 percentage
  memoryUsage: number;        // 0-100 percentage
  requestsPerSecond: number;  // Traffic volume
  averageResponseTime: number; // ms
  errorRate: number;          // percentage
  activeConnections: number;   // concurrent connections
  diskUsage: number;          // 0-100 percentage
  networkLatency: number;     // ms
}
```

**Where to get these metrics:**

| Metric | Source | Command |
|--------|--------|---------|
| CPU Usage | System | `top`, `vmstat`, or monitoring agent |
| Memory | System | `free -h`, `ps aux` |
| Requests/sec | Application | Access logs, APM tools |
| Response Time | APM | Application Performance Monitoring |
| Error Rate | Logs | Parse error logs or APM |
| Connections | netstat | `netstat -an \| grep ESTABLISHED` |
| Disk Usage | System | `df -h` |
| Latency | ping/traceroute | Network monitoring |

### Step 2: Implement Health Monitoring Client

Create a client to continuously send metrics:

```typescript
// src/clients/health-monitoring-client.ts
import axios from 'axios';

const healthApi = axios.create({
  baseURL: 'http://localhost:3001/api/health'
});

export async function analyzeServerHealth(metrics: ServerMetrics) {
  try {
    const response = await healthApi.post('/analyze-server', metrics);
    return response.data;
  } catch (error) {
    console.error('Health analysis failed:', error);
    throw error;
  }
}

export async function predictCrash(metrics: ServerMetrics) {
  try {
    const response = await healthApi.post('/predict-crash', metrics);
    return response.data;
  } catch (error) {
    console.error('Crash prediction failed:', error);
    throw error;
  }
}

export async function getLoadBalancingSuggestions(
  allServersMetrics: ServerMetrics[]
) {
  try {
    const response = await healthApi.post(
      '/load-balancing-suggestions',
      allServersMetrics
    );
    return response.data;
  } catch (error) {
    console.error('Load balancing analysis failed:', error);
    throw error;
  }
}

export async function testFeatureLoad(featureMetrics: FeatureLoadTest) {
  try {
    const response = await healthApi.post('/test-feature-load', featureMetrics);
    return response.data;
  } catch (error) {
    console.error('Feature load test failed:', error);
    throw error;
  }
}
```

### Step 3: Set Up Continuous Monitoring

Create a monitoring loop that runs every 30 seconds:

```typescript
// src/services/monitoring-service.ts
import { analyzeServerHealth, predictCrash } from '../clients/health-monitoring-client';

class MonitoringService {
  private interval: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL = 30000; // 30 seconds

  start() {
    console.log('Starting server health monitoring...');
    
    this.interval = setInterval(async () => {
      try {
        // Collect metrics from this server
        const metrics = await this.collectMetrics();
        
        // Analyze health
        const health = await analyzeServerHealth(metrics);
        
        // Check for crash risk
        if (health.crashRisk > 50) {
          console.warn(`⚠️ High crash risk detected: ${health.crashRisk}%`);
          await this.triggerAlert(health);
        }
        
        // Log for debugging
        console.log(`Server health: ${health.status} (Score: ${health.healthScore})`);
        
      } catch (error) {
        console.error('Monitoring cycle failed:', error);
      }
    }, this.CHECK_INTERVAL);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      console.log('Monitoring stopped');
    }
  }

  private async collectMetrics(): Promise<ServerMetrics> {
    // Implementation to collect actual metrics
    return {
      serverId: process.env.SERVER_ID || 'default',
      cpuUsage: getCurrentCPU(),
      memoryUsage: getCurrentMemory(),
      requestsPerSecond: getRPS(),
      averageResponseTime: getAvgResponseTime(),
      errorRate: getErrorRate(),
      activeConnections: getActiveConnections(),
      diskUsage: getDiskUsage(),
      networkLatency: getNetworkLatency()
    };
  }

  private async triggerAlert(health: any) {
    // Send email, Slack message, PagerDuty alert, etc.
    console.log('🚨 Alert triggered:', health.suggestions);
  }
}

// Usage
const monitor = new MonitoringService();
monitor.start(); // Start on application startup
```

### Step 4: Implement Load Balancing

When crash risk increases, implement load balancing:

```typescript
// src/services/load-balancer.ts
import { getLoadBalancingSuggestions } from '../clients/health-monitoring-client';

class LoadBalancer {
  async balanceLoad(allServers: ServerMetrics[]) {
    // Get recommendations from health service
    const suggestions = await getLoadBalancingSuggestions(allServers);
    
    if (suggestions.summary.stressedServers > 0) {
      console.log('🔄 Balancing load across servers...');
      
      for (const suggestion of suggestions.serverSuggestions) {
        if (suggestion.priority === 'critical') {
          // Implement load shifting
          await this.redirectTraffic(
            suggestion.serverId,
            suggestion.targetServers,
            50 // percentage to redirect
          );
        }
      }
    }
  }

  private async redirectTraffic(
    fromServer: string,
    toServers: string[],
    percentage: number
  ) {
    // Update load balancer configuration
    // This could be nginx, HAProxy, or cloud load balancer configuration
    console.log(
      `Redirecting ${percentage}% traffic from ${fromServer} to ${toServers.join(', ')}`
    );
    // Implementation depends on your infrastructure
  }
}
```

### Step 5: Feature Testing Before Deployment

Test all new features for performance impact:

```typescript
// src/services/deployment-service.ts
import { testFeatureLoad, compareWithFeature } from '../clients/health-monitoring-client';

class DeploymentService {
  async canDeploy(feature: Feature, baselineMetrics: ServerMetrics): Promise<boolean> {
    console.log(`Testing feature: ${feature.name}`);
    
    // Get current baseline
    const baseline = await this.getCurrentBaseline();
    
    // Test feature performance impact
    const loadTestResult = await testFeatureLoad({
      featureName: feature.name,
      baselineMetrics: baseline,
      featureMetrics: feature.expectedMetrics
    });
    
    // Check if safe to deploy
    if (loadTestResult.status === 'pass') {
      console.log(`✅ ${feature.name} is safe to deploy`);
      return true;
    } else if (loadTestResult.status === 'warning') {
      console.log(`⚠️ ${feature.name} needs optimization before deploy`);
      return false;
    } else {
      console.log(`❌ ${feature.name} will cause crashes - do NOT deploy`);
      return false;
    }
  }

  async deployFeature(feature: Feature, deployment: 'immediate' | 'canary' | 'staged') {
    if (!await this.canDeploy(feature, {})) {
      throw new Error(`Feature ${feature.name} is not ready for deployment`);
    }

    switch (deployment) {
      case 'immediate':
        console.log('Deploying to all users...');
        // Full deployment
        break;
        
      case 'canary':
        console.log('Deploying to 5% of users...');
        // Deploy to 5% first
        await new Promise(resolve => setTimeout(resolve, 300000)); // Wait 5 min
        // If no issues, scale to 100%
        break;
        
      case 'staged':
        console.log('Deploying in stages: 10% → 25% → 50% → 100%');
        // Staged rollout
        break;
    }
  }

  private async getCurrentBaseline(): Promise<ServerMetrics> {
    // Get current production metrics
    return {
      serverId: 'production',
      cpuUsage: 45,
      memoryUsage: 52,
      requestsPerSecond: 1000,
      averageResponseTime: 200,
      errorRate: 0.2,
      activeConnections: 3000,
      diskUsage: 60,
      networkLatency: 10
    };
  }
}
```

---

## 🚨 Alert Configuration

### Set Up Alert Thresholds

Create an alert configuration:

```typescript
// src/config/alert-thresholds.ts
export const AlertThresholds = {
  // Critical alerts (immediate action needed)
  CRASH_RISK_CRITICAL: 70,      // > 70% = Critical
  CPU_CRITICAL: 90,              // > 90% = Critical
  MEMORY_CRITICAL: 90,           // > 90% = Critical
  ERROR_RATE_CRITICAL: 10,       // > 10% = Critical

  // Warning alerts (attention needed)
  CRASH_RISK_WARNING: 50,        // > 50% = Warning
  CPU_WARNING: 75,               // > 75% = Warning
  MEMORY_WARNING: 75,            // > 75% = Warning
  ERROR_RATE_WARNING: 5,         // > 5% = Warning

  // Scaling alerts
  SCALE_UP_TRIGGER: 80,          // CPU > 80% for 5 min = scale up
  SCALE_DOWN_TRIGGER: 30,        // CPU < 30% for 15 min = scale down
};

export const AlertActions = {
  warning: {
    notify: ['slack', 'email'],
    autoAction: false
  },
  critical: {
    notify: ['slack', 'email', 'pagerduty'],
    autoAction: true,
    actions: ['load_balance', 'trigger_scaling']
  }
};
```

---

## 📈 Scaling Strategy

### Manual Scaling Checklist

When crash risk exceeds thresholds:

```
☐ Step 1: Alert team (Slack)
☐ Step 2: Analyze root cause (CPU vs Memory vs I/O)
☐ Step 3: Estimate needed capacity
☐ Step 4: Provision new servers (cloud: 5-10 minutes)
☐ Step 5: Deploy to new servers
☐ Step 6: Configure load balancer
☐ Step 7: Monitor new servers (15 minutes)
☐ Step 8: Document the event
```

### Auto-Scaling Configuration

```yaml
# docker-compose auto-scale rules
auto_scaling:
  min_servers: 2
  max_servers: 20
  scale_up_condition: "cpu > 80% for 300 seconds"
  scale_down_condition: "cpu < 30% for 900 seconds"
  instance_warmup_time: 600 # 10 minutes
  metrics_window: 60 # 1 minute average
```

---

## 🔍 Debugging Guide

### Common Issues and Solutions

#### Issue 1: High CPU Usage

```typescript
// Diagnosis
const analysis = await analyzeServerHealth(metrics);
if (analysis.suggestions.includes('CPU usage critically high')) {
  // CPU is the bottleneck
  
  // Solutions:
  // 1. Optimize database queries
  // 2. Add caching (Redis)
  // 3. Implement background jobs
  // 4. Scale horizontally (add servers)
}
```

#### Issue 2: Memory Leaks

```typescript
// Detection
if (memoryUsage > 80) {
  // Check for memory leaks
  // Use: node --expose-gc app.js
  // Or: Monitor heap dumps
  
  // Solutions:
  // 1. Review event listeners (are they being cleaned up?)
  // 2. Check for circular references
  // 3. Implement memory profiling
}
```

#### Issue 3: Slow Response Times

```typescript
// Check if database is bottleneck
if (avgResponseTime > 1000) {
  // 1. Enable query logging
  // 2. Add database indices
  // 3. Implement query caching
  // 4. Consider database replication
}
```

---

## 📊 Performance Tuning

### Before Production Deployment

Run these checks:

```bash
# 1. Load test with realistic traffic
./load-test.sh --rps 2000 --duration 600

# 2. Memory profile
node --expose-gc --inspect app.js

# 3. Database optimization
npm run db:analyze
npm run db:optimize

# 4. Cache configuration
redis-cli INFO memory

# 5. Health check
curl http://localhost:3001/api/health/health-check
```

### Baseline Metrics (For Reference)

```typescript
// Healthy server baseline
export const HealthyServerBaseline = {
  cpuUsage: { min: 0, max: 70 },         // Comfortable range
  memoryUsage: { min: 0, max: 75 },      // Sufficient headroom
  responseTime: { max: 500 },             // Acceptable latency
  errorRate: { max: 0.1 },                // Very low errors
  crashRisk: { max: 20 }                  // Low risk
};

// Under stress
export const StressedServerBaseline = {
  cpuUsage: { max: 85 },                  // Getting hot
  memoryUsage: { max: 85 },               // Limited headroom
  responseTime: { max: 2000 },            // Users notice slowdown
  errorRate: { max: 2 },                  // Some failures
  crashRisk: { max: 50 }                  // Moderate risk
};

// Critical
export const CriticalServerBaseline = {
  cpuUsage: { min: 90 },                  // About to fail
  memoryUsage: { min: 90 },               // Almost OOM
  responseTime: { min: 5000 },            // Very slow
  errorRate: { min: 5 },                  // Many failures
  crashRisk: { min: 70 }                  // High risk
};
```

---

## ✅ Verification Checklist

Before going live:

- [ ] Continuous monitoring running (checking every 30 seconds)
- [ ] Load balancing rules configured
- [ ] Alert system connected (Slack/Email/PagerDuty)
- [ ] Auto-scaling rules in place
- [ ] All features tested with `test-feature-load`
- [ ] Rollback procedures documented
- [ ] Team trained on escalation procedures
- [ ] Monitoring dashboard visible to ops team
- [ ] Crash risk stays < 50% during peak load
- [ ] Zero downtime achieved in last 30 days of testing

---

## 🚀 Launch Checklist

Ready for production launch:

```typescript
// Pre-launch validation
const readyForLaunch = {
  backendHealthy: analysis.status === 'healthy',
  allTestsPassing: await runHealthTests(),
  metricsCollecting: monitoringService.isRunning,
  loadBalancerActive: loadBalancer.isConfigured,
  alertsConfigured: alertSystem.isEnabled,
  teamReady: opsTeamNotified,
  rollbackPlan: documentedAndTested
};

if (Object.values(readyForLaunch).every(v => v === true)) {
  console.log('✅ Ready for production launch!');
} else {
  console.log('❌ Fix issues before launch');
}
```

---

This guide ensures your system runs smoothly during high-traffic events with **zero crashes** and **optimal performance**!
