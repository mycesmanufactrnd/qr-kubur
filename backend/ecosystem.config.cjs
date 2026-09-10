module.exports = {
  apps: [
    {
      name: "qubur-backend",
      script: "dist/server.js",
      exec_mode: "cluster",
      instances: 5,
    },
  ],
};
