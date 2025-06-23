module.exports = {
  apps: [
    {
      name: "codepatchwork",
      script: "dist/index.js",
      node_args: "-r dotenv/config",
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
