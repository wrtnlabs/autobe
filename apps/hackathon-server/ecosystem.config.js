module.exports = {
  apps: [
    {
      name: "hackathon-server",
      script: "pnpm",
      args: "run start",
      instances: 4,
      exec_mode: "cluster",
    },
  ],
};
