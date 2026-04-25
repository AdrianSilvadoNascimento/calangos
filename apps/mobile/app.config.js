const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

const APP_ENV = process.env.APP_ENV || 'development';
const envFile = `.env.${APP_ENV}`;
const envPath = path.resolve(__dirname, envFile);

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

module.exports = ({ config }) => {
  return {
    ...config,
    extra: {
      eas: {
        projectId: process.env.EAS_PROJECT_ID,
      },
      apiUrl: process.env.EXPO_PUBLIC_API_URL,
      nodeEnv: APP_ENV,
    },
  };
};
