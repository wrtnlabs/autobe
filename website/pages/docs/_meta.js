const open = (title) => ({
  title,
  theme: {
    collapsed: false,
  },
});

export default {
  index: "🙋🏻‍♂️ Introduction",
  setup: "📦 Setup",
  concepts: open("🔍 Concepts"),

  "-- features": {
    type: "separator",
    title: "📖 Features",
  },
  agent: open("🤖 Agent Library"),
  websocket: open("📡 WebSocket Protocol"),
  backend: open("🛠️ Backend Stack"),

  "-- appendix": {
    type: "separator",
    title: "🔗 Appendix",
  },
  roadmap: open("📅 Roadmap"),
  related: open("📊 Related Projects"),
  api: {
    title: "⇲ API Documents",
    href: "/api",
  },
};
