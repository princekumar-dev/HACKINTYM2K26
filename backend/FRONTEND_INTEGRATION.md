# Backend Integration Guide for Frontend

This guide explains how to integrate the HackintyM2K26 backend API with your React frontend.

## Setup

### 1. API Client Configuration

Create `src/services/api.ts`:

```typescript
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  },
);

export default api;
```

### 2. API Service Functions

Create `src/services/backendService.ts`:

```typescript
import api from './api';

// Monitoring endpoints
export const monitoringService = {
  analyzeUrl: async (url: string) => {
    const response = await api.post('/api/monitoring/analyze-url', { url });
    return response.data;
  },
  
  bulkAnalyze: async (urls: string[]) => {
    const response = await api.post(
      '/api/monitoring/bulk-analyze',
      urls.map(url => ({ url }))
    );
    return response.data;
  },
};

// Analysis endpoints
export const analysisService = {
  analyzeCode: async (code: string, language: string = 'javascript') => {
    const response = await api.post('/api/analysis/analyze-code', {
      code,
      language,
    });
    return response.data;
  },
  
  batchAnalyze: async (codes: Array<{ code: string; language?: string }>) => {
    const response = await api.post('/api/analysis/batch-analyze', codes);
    return response.data;
  },
};

// Features endpoints
export const featuresService = {
  compareFeature: async (
    featureName: string,
    currentCode: string,
    proposedCode: string,
    affectedComponents?: string[]
  ) => {
    const response = await api.post('/api/features/compare', {
      featureName,
      currentCode,
      proposedCode,
      affectedComponents,
    });
    return response.data;
  },
  
  simulateInjection: async (
    featureName: string,
    currentCode: string,
    proposedCode: string,
    affectedComponents?: string[]
  ) => {
    const response = await api.post('/api/features/simulate-injection', {
      featureName,
      currentCode,
      proposedCode,
      affectedComponents,
    });
    return response.data;
  },
};
```

### 3. Environment Variables

Create `.env` in your frontend root:

```
REACT_APP_API_URL=http://localhost:3001
```

For production:
```
REACT_APP_API_URL=https://your-backend-url.com
```

## Usage Examples

### URL Monitoring

```typescript
import { monitoringService } from '@/services/backendService';

// In a React component
const [analysis, setAnalysis] = useState(null);
const [loading, setLoading] = useState(false);

const handleAnalyzeUrl = async (url: string) => {
  setLoading(true);
  try {
    const result = await monitoringService.analyzeUrl(url);
    setAnalysis(result);
  } catch (error) {
    console.error('Analysis failed:', error);
  } finally {
    setLoading(false);
  }
};
```

### Code Analysis

```typescript
import { analysisService } from '@/services/backendService';

const handleAnalyzeCode = async (code: string) => {
  try {
    const result = await analysisService.analyzeCode(code, 'javascript');
    console.log('Health Score:', result.healthScore);
    console.log('Performance Score:', result.performanceScore);
    console.log('Issues:', result.issues);
    console.log('Suggestions:', result.suggestions);
  } catch (error) {
    console.error('Code analysis failed:', error);
  }
};
```

### Feature Comparison

```typescript
import { featuresService } from '@/services/backendService';

const handleCompareFeature = async (
  featureName: string,
  currentCode: string,
  proposedCode: string
) => {
  try {
    const comparison = await featuresService.compareFeature(
      featureName,
      currentCode,
      proposedCode,
      ['Component1', 'Component2']
    );
    
    console.log('Impact Level:', comparison.impactLevel);
    console.log('Risk Level:', comparison.riskLevel);
    console.log('Improvements:', comparison.improvements);
    console.log('Recommendations:', comparison.recommendations);
  } catch (error) {
    console.error('Feature comparison failed:', error);
  }
};
```

## Data Visualization Components

### URL Analysis Visualization

```typescript
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export function UrlAnalysisChart({ analysis }) {
  const data = [
    { name: 'Health', value: analysis.healthScore },
    { name: 'Performance', value: analysis.performanceScore },
    { name: 'Uptime', value: analysis.uptime },
  ];

  return (
    <BarChart width={600} height={300} data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis domain={[0, 100]} />
      <Tooltip />
      <Bar dataKey="value" fill="#8884d8" />
    </BarChart>
  );
}
```

### Code Analysis Metrics

```typescript
import { PieChart, Pie, Cell } from 'recharts';

export function CodeAnalysisMetrics({ analysis }) {
  const data = [
    { name: 'Health', value: analysis.healthScore },
    { name: 'Performance', value: analysis.performanceScore },
    { name: 'Maintainability', value: analysis.maintainabilityScore },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

  return (
    <PieChart width={400} height={300}>
      <Pie
        data={data}
        cx={200}
        cy={150}
        labelLine={false}
        label={({ name, value }) => `${name}: ${value}`}
        outerRadius={80}
        fill="#8884d8"
        dataKey="value"
      >
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>
    </PieChart>
  );
}
```

### Feature Comparison Dashboard

```typescript
export function FeatureComparisonDashboard({ comparison }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <MetricCard
          title="Impact Level"
          value={comparison.impactLevel}
          color={getImpactColor(comparison.impactLevel)}
        />
        <MetricCard
          title="Risk Level"
          value={comparison.riskLevel}
          color={getRiskColor(comparison.riskLevel)}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <ImprovementMetric
          label="Performance"
          value={comparison.improvements.performance}
        />
        <ImprovementMetric
          label="Health"
          value={comparison.improvements.health}
        />
        <ImprovementMetric
          label="Latency"
          value={comparison.improvements.latency}
        />
      </div>

      <RecommendationsList recommendations={comparison.recommendations} />
    </div>
  );
}
```

## State Management with Redux/Zustand

### Redux Example

```typescript
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { monitoringService } from '@/services/backendService';

export const analyzeUrl = createAsyncThunk(
  'monitoring/analyzeUrl',
  async (url: string) => {
    return await monitoringService.analyzeUrl(url);
  }
);

const monitoringSlice = createSlice({
  name: 'monitoring',
  initialState: {
    analysis: null,
    loading: false,
    error: null,
  },
  extraReducers: (builder) => {
    builder
      .addCase(analyzeUrl.pending, (state) => {
        state.loading = true;
      })
      .addCase(analyzeUrl.fulfilled, (state, action) => {
        state.loading = false;
        state.analysis = action.payload;
      })
      .addCase(analyzeUrl.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export default monitoringSlice.reducer;
```

## Error Handling

```typescript
async function handleApiCall(apiFn) {
  try {
    return await apiFn();
  } catch (error) {
    if (error.response) {
      // Server responded with error status
      console.error('API Error:', error.response.status, error.response.data);
      return {
        error: error.response.data.message || 'An error occurred',
        status: error.response.status,
      };
    } else if (error.request) {
      // Request made but no response
      console.error('Network Error:', error.message);
      return {
        error: 'Network error. Please check your connection.',
      };
    } else {
      // Error in request setup
      console.error('Error:', error.message);
      return {
        error: error.message,
      };
    }
  }
}
```

## Real-time Updates (WebSocket - Optional Enhancement)

For real-time monitoring updates:

```typescript
export class MonitoringWebSocket {
  private ws: WebSocket;

  connect(onMessage: (data: any) => void) {
    this.ws = new WebSocket(
      process.env.REACT_APP_WS_URL || 'ws://localhost:3001'
    );

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessage(data);
    };
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}
```

## Troubleshooting

### CORS Issues
Ensure backend `.env` has correct `FRONTEND_URL`:
```
FRONTEND_URL=http://localhost:5173
```

### Connection Refused
- Check if backend is running on port 3001
- Verify `REACT_APP_API_URL` environment variable

### Timeout Issues
- Increase timeout in axios config
- Check MongoDB connection in backend

## Performance Tips

1. **Debounce API calls**: Avoid repeated requests
```typescript
import { debounce } from 'lodash';

const debouncedAnalyze = debounce(analyzeUrl, 1000);
```

2. **Caching**: Store results to reduce requests
```typescript
const cache = new Map();
const getCachedAnalysis = (url: string) => {
  if (cache.has(url)) return cache.get(url);
  // fetch and cache...
};
```

3. **Batch operations**: Use bulk endpoints when possible
```typescript
const results = await monitoringService.bulkAnalyze([
  'https://example1.com',
  'https://example2.com',
]);
```

## Next Steps

1. Create UI components for visualization
2. Implement caching strategy
3. Add error boundaries for better UX
4. Set up real-time monitoring (WebSocket)
5. Implement feature flag system for new analyses
