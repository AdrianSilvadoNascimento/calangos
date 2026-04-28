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
        projectId: 'dce12804-cdb3-4820-83ee-12a2c3b54c1d',
      },
      apiUrl: process.env.EXPO_PUBLIC_API_URL,
      nodeEnv: APP_ENV,
    },
  };
};
