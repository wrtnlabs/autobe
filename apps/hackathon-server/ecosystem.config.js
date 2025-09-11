module.exports = {
  apps: [
    {
      name: "hackathon-server",
      script: "src/executable/server.ts",
      interpreter: "node",
      interpreter_args: "-r ts-node/register",
      instances: 4,
      exec_mode: "cluster",
    },
  ],
};
