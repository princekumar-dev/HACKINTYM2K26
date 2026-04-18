# Quick Start Guide

Get the HackintyM2K26 Backend running in minutes.

## Option 1: Local Development (Recommended)

### Prerequisites
- Node.js 16+ installed
- MongoDB running locally or MongoDB Atlas account

### Setup (5 minutes)

1. **Install dependencies:**
```bash
npm install
```

2. **Configure environment:**
```bash
cp .env.example .env
```

Edit `.env`:
- Change `MONGODB_URI` if using MongoDB Atlas or different port
- Set `FRONTEND_URL` to your frontend location

3. **Start MongoDB (if local):**
```bash
# Windows
mongod

# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

4. **Run backend:**
```bash
npm run start:dev
```

You should see:
```
✅ Backend server is running on port 3001
📚 API Documentation: http://localhost:3001/api/docs
```

5. **Test the API:**
Open browser: `http://localhost:3001/api/docs`

Or use curl:
```bash
curl -X POST http://localhost:3001/api/monitoring/analyze-url \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'
```

## Option 2: Docker (Recommended for Production)

### Prerequisites
- Docker installed
- Docker Compose installed

### Setup (3 minutes)

1. **Start all services:**
```bash
docker-compose up -d
```

This starts:
- MongoDB on port 27017
- Backend API on port 3001
- Mongo Express (MongoDB UI) on port 8081

2. **Check logs:**
```bash
docker-compose logs -f backend
```

3. **Stop services:**
```bash
docker-compose down
```

4. **Access services:**
- API: `http://localhost:3001`
- API Docs: `http://localhost:3001/api/docs`
- MongoDB UI: `http://localhost:8081` (admin/password)

## Option 3: Production Deployment

### Prerequisites
- Node.js installed on production server
- MongoDB Atlas or managed database
- PM2 for process management (optional)

### Setup

1. **Clone and install:**
```bash
git clone <repo-url>
cd backend
npm install
```

2. **Configure environment:**
```bash
cp .env.example .env
# Edit .env with production settings
```

3. **Build:**
```bash
npm run build
```

4. **Run with PM2 (recommended):**
```bash
npm install -g pm2
pm2 start npm --name "hackintym2k26-api" -- run start:prod
pm2 save
```

5. **Monitor:**
```bash
pm2 logs hackintym2k26-api
pm2 status
```

## Verification

After startup, verify the backend is working:

### Check Health
```bash
curl http://localhost:3001/api/docs
```

### Test Monitoring
```bash
curl -X POST http://localhost:3001/api/monitoring/analyze-url \
  -H "Content-Type: application/json" \
  -d '{"url":"https://github.com"}'
```

### Test Code Analysis
```bash
curl -X POST http://localhost:3001/api/analysis/analyze-code \
  -H "Content-Type: application/json" \
  -d '{
    "code": "function test() { return 42; }",
    "language": "javascript"
  }'
```

### Test Feature Comparison
```bash
curl -X POST http://localhost:3001/api/features/compare \
  -H "Content-Type: application/json" \
  -d '{
    "featureName": "test-feature",
    "currentCode": "function test() { return 1; }",
    "proposedCode": "function test() { return 1 + 1; }",
    "affectedComponents": ["TestComponent"]
  }'
```

## Common Issues

### MongoDB Connection Refused
**Problem:** `MongoNetworkError: connect ECONNREFUSED`

**Solution:**
```bash
# Check if MongoDB is running
mongod --version

# Start MongoDB
mongod

# Or use MongoDB Atlas instead (change MONGODB_URI in .env)
```

### Port Already in Use
**Problem:** `Port 3001 is already in use`

**Solution:**
```bash
# Change port in .env
PORT=3002

# Or kill the process
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :3001
kill -9 <PID>
```

### Module Not Found
**Problem:** `Cannot find module '@nestjs/core'`

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### CORS Errors
**Problem:** Cross-Origin Request blocked

**Solution:** Check `.env`:
```
FRONTEND_URL=http://localhost:5173
# or your actual frontend URL
```

## Development Commands

```bash
# Start in watch mode
npm run start:dev

# Run tests
npm run test
npm run test:watch

# Lint code
npm run lint

# Format code
npm run format

# Build for production
npm run build
```

## Next Steps

1. ✅ Backend is running
2. ⏭️ Connect frontend (see FRONTEND_INTEGRATION.md)
3. ⏭️ Configure MongoDB (production)
4. ⏭️ Set up monitoring/logging
5. ⏭️ Deploy to production

## Support

- 📚 API Docs: `http://localhost:3001/api/docs`
- 📖 README.md: Full documentation
- 🐛 GitHub Issues: Report bugs
- 💬 GitHub Discussions: Ask questions
