export class ConfigService {
  private readonly config = {
    port: process.env.PORT || 3001,
    mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/hackintym2k26',
    nodeEnv: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  };

  get(key: keyof typeof this.config) {
    return this.config[key];
  }

  getAll() {
    return this.config;
  }
}
