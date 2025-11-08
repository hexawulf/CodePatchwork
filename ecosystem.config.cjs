const dotenv = require('dotenv');
const path = require('path');

// Load .env file from project root
dotenv.config({ path: path.join(__dirname, '.env') });

module.exports = {
  apps: [
    {
      name: "codepatchwork",
      script: "dist/index.js",
      cwd: __dirname,
      env: {
        NODE_ENV: "production",
        PORT: process.env.PORT,
        DATABASE_URL: process.env.DATABASE_URL,
        PGDATABASE: process.env.PGDATABASE,
        PGUSER: process.env.PGUSER,
        PGPASSWORD: process.env.PGPASSWORD,
        PGHOST: process.env.PGHOST,
        PGPORT: process.env.PGPORT,
        VITE_FIREBASE_API_KEY: process.env.VITE_FIREBASE_API_KEY,
        VITE_FIREBASE_APP_ID: process.env.VITE_FIREBASE_APP_ID,
        VITE_FIREBASE_PROJECT_ID: process.env.VITE_FIREBASE_PROJECT_ID,
        VITE_FIREBASE_MESSAGING_SENDER_ID: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        VITE_FIREBASE_AUTH_DOMAIN: process.env.VITE_FIREBASE_AUTH_DOMAIN,
        VITE_FIREBASE_STORAGE_BUCKET: process.env.VITE_FIREBASE_STORAGE_BUCKET,
        VITE_FIREBASE_MEASUREMENT_ID: process.env.VITE_FIREBASE_MEASUREMENT_ID,
        SESSION_SECRET: process.env.SESSION_SECRET,
        VITE_PUBLIC_URL: process.env.VITE_PUBLIC_URL,
        GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS
      }
    }
  ]
};
