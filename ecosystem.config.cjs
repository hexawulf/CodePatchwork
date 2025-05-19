module.exports = {
  apps: [{
    name: "codepatchwork",
    script: "npm",
    args: "start",
    cwd: "/home/zk/projects/CodePatchwork",
    env: {
      NODE_ENV: "production",
      PORT: 3001  // Add this line
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: "1G"
  }]
};
