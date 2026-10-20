<div align="center">

# HackintyM2K26

### Infrastructure Resilience Platform — Simulate Failures, Monitor Reality, Predict Impact

**A hackathon build (April 2026): a 3D self-healing simulator, live URL monitoring, AST code
analysis and feature-injection prediction in one dashboard**

![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-Vite_dashboard-61DAFB?logo=react&logoColor=black)
![three.js](https://img.shields.io/badge/three.js-3D_topology-049EF4?logo=threedotjs&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-API-E0234E?logo=nestjs&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-storage-47A248?logo=mongodb&logoColor=white)
![Swagger](https://img.shields.io/badge/Swagger-17_endpoints-85EA2D?logo=swagger&logoColor=black)

</div>

---

## 📖 Overview

HackintyM2K26 answers a hard question with four connected tools: **what happens when
infrastructure fails, how do we see real degradation early, is the code healthy, and what will a
new feature cost before we ship it?**

- **Simulate** — inject failures (kill / slow / overload) into a 3D server topology and watch the
  platform heal: rerouting, failover to backup, dummy-user shedding
- **Monitor** — probe real URLs over HTTP and score latency, health and predicted failure windows
  (DNS/TCP/TLS breakdown included)
- **Analyze** — parse source code with Babel AST for cyclomatic/Halstead complexity and
  health/performance/maintainability scores
- **Predict** — simulate feature injection to estimate performance impact, risk, memory/CPU cost
  and implementation time before writing the code

## ✨ Features

### 🌐 3D Self-Healing Simulator (frontend)
- **Live 3D network graph** (three.js) of six server roles — gateway, frontend, API, AI, database,
  cache — with per-node latency, CPU, load, errors and capacity
- **Failure injection**: `kill`, `slow` or `overload` any node with adjustable intensity and probability
- **Autonomous response**: nodes transition healthy → warning → critical → **healing**, with
  reroutes and failover to backup servers
- **Decision log stream** (info / warn / alert / heal / ok) explaining every autonomous action
- **Simulation results**: crash probability, resilience score, throughput after recovery, and how
  real vs dummy users were shifted or dropped

### 📡 Live Deployment Monitor
- Real HTTP checks against your running frontend + backend with **overall / frontend / backend scores**
- Status: `ok` / `slow` / `down`, **predicted failure window**, live or offline mode
- App-topology analysis endpoint maps how services depend on each other

### 🔍 AST Code Analysis
- Babel-powered parsing of JavaScript/TypeScript
- **Cyclomatic & Halstead complexity**, dependency tracking, comment ratio
- Health / performance / maintainability **scores with concrete issues and suggestions**
- Batch mode for whole-file sets

### ⚙️ Feature-Injection Prediction
- Compare current vs proposed implementations
- Predicted **performance impact, risk level, memory & CPU estimates**
- Required changes and implementation-time estimates with recommendations

### 🩺 Health & Load Toolkit
- Server analysis, **crash prediction**, high-load simulation
- **Load-balancing and auto-scaling suggestions**
- Feature load-testing and randomized feature monitoring

## 🏗️ Architecture

```
┌──────────────────────────────┐
│  React + Vite dashboard :3000│  shadcn/ui · Tailwind · three.js · Zustand
│  3D simulator · monitor · UI │
└──────────────┬───────────────┘
               │ REST  /api  (Vite proxy → :3001)
┌──────────────▼───────────────┐
│     NestJS API server :3001  │  Swagger-documented, 17 endpoints
│  Monitoring · Analysis ·     │  Babel AST · Axios probes · validators
│  Features · Health modules   │
└──────────────┬───────────────┘
               │ MongoDB :27017
┌──────────────▼───────────────┐
│  UrlAnalysis · CodeAnalysis ·│  persisted results & comparisons
│  FeatureComparison · health  │
└──────────────────────────────┘
```

## 🔌 API Surface

| Controller | Endpoints |
|---|---|
| `/api/monitoring` | `analyze-url` · `bulk-analyze` · `analyze-app-topology` · `simulate-app-resilience` |
| `/api/analysis` | `analyze-code` · `batch-analyze` |
| `/api/features` | `compare` · `simulate-injection` |
| `/api/health` | `analyze-server` · `simulate-high-load` · `predict-crash` · `load-balancing-suggestions` · `suggest-scaling` · `test-feature-load` · `feature-random-monitoring` · `compare-with-feature` · `health-check` |

Request/response examples: [`backend/API_EXAMPLES.md`](backend/API_EXAMPLES.md) ·
interactive Swagger UI at `http://localhost:3001/api` (when the server runs).

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript, Vite, shadcn/ui + Tailwind CSS, three.js, Zustand, Recharts, Sonner |
| Backend | NestJS, Mongoose, class-validator, Swagger, @babel/parser + traverse |
| Data | MongoDB (6 schemas: URL/code/feature analysis, load tests, health, topology) |
| Quality | Vitest (frontend), Jest-style service specs (backend), ESLint + Prettier |
| DevOps | Dockerfile + docker-compose for the backend, start scripts (`.sh` / `.bat`) |

## 🚀 Getting Started

### Prerequisites
- **Node.js 18+**
- **MongoDB** running locally (`mongodb://localhost:27017`) or an Atlas URI

### 1. Backend

```bash
cd backend
cp .env.example .env        # PORT=3001, MONGODB_URI, FRONTEND_URL
npm install
npm run start:dev           # http://localhost:3001
```

Or with Docker:

```bash
cd backend
docker compose up --build
```

### 2. Frontend

```bash
# from the repo root
npm install
npm run dev                 # http://localhost:3000  (proxies /api → :3001)
```

Open `http://localhost:3000`, pick a failure scenario in the **Control Panel**, hit run, and watch
the 3D topology heal — then switch to the monitor tab to score a live deployment.

### Tests

```bash
npm test              # frontend (Vitest)
cd backend && npm test
```

## 📁 Repository Structure

```
HACKINTYM2K26/
├── src/                          # Frontend (React + Vite)
│   ├── components/dashboard/     # ControlPanel, NetworkGraph3D, MetricsPanel,
│   │                             # MonitorPanel, LogsPanel, SimulationResultsPanel
│   ├── components/ui/            # shadcn/ui kit
│   ├── store/simStore.ts         # Zustand simulation state (nodes, failures, runs)
│   └── pages/Index.tsx           # single-page dashboard
├── backend/                      # NestJS API
│   └── src/modules/
│       ├── monitoring/           # URL + topology + resilience endpoints
│       ├── analysis/             # Babel AST code analysis
│       ├── features/             # comparison + injection simulation
│       └── health/               # load, crash prediction, scaling
├── backend/ARCHITECTURE.md       # deep-dive architecture & deployment guide
├── backend/API_EXAMPLES.md       # request/response recipes
└── backend/QUICKSTART.md         # fastest path to a running API
```

## 📚 Backend Documentation

The backend ships with a full doc set in [`backend/`](backend/):
[ARCHITECTURE.md](backend/ARCHITECTURE.md) · [GETTING_STARTED.md](backend/GETTING_STARTED.md) ·
[API_EXAMPLES.md](backend/API_EXAMPLES.md) · [HEALTH_MONITORING_GUIDE.md](backend/HEALTH_MONITORING_GUIDE.md) ·
[FRONTEND_INTEGRATION.md](backend/FRONTEND_INTEGRATION.md) · [DOCS_INDEX.md](backend/DOCS_INDEX.md)

## 🧭 Project Notes

- Built during **HackintyM 2K26** (April 2026) — hackathon scope, production ambitions
- Frontend scaffold generated with [Lovable](https://lovable.dev), then extended substantially
  (3D simulator, monitoring panels, Zustand simulation engine)
- The simulator runs **entirely client-side**; the backend is only needed for live monitoring,
  code analysis and prediction endpoints

## 📄 License

No license file has been declared yet — all rights reserved by the author unless stated otherwise.

## 👤 Author

**Prince Kumar** — [@princekumar-dev](https://github.com/princekumar-dev)

---

<div align="center">
<sub><b>HackintyM2K26</b> — break it in simulation, so it doesn't break in production.</sub>
</div>
