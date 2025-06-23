module.exports = {
  apps: [{
    name: "codepatchwork",
    script: "npm",
    args: "start",
    cwd: "/home/zk/projects/CodePatchwork",
    env: {
      NODE_ENV: "production",
      PORT: 3001,
      DATABASE_URL: "postgresql://codepatchwork_user:1S1HwpTVdmilD8tNeGmI@localhost:5432/codepatchwork",
      PGDATABASE: "codepatchwork",
      PGUSER: "codepatchwork_user",
      PGPASSWORD: "1S1HwpTVdmilD8tNeGmI",
      PGHOST: "localhost",
      PGPORT: "5432",
      SESSION_SECRET: "d8f49a7c31e5b8a2c6f3e9d1b5a7c2e0f3d6a9b8c5e2f1d4a7b3c6e9f2d5a8c1b4e7f0d3a6b9c2e5f8a1d4b7c0",
      VITE_PUBLIC_URL: "https://codepatchwork.com",
      GOOGLE_APPLICATION_CREDENTIALS: "/home/zk/projects/CodePatchwork/codepatchwork-c3d85-firebase-adminsdk-fbsvc-cce84a84c0.json"
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: "1G"
  }]
};
