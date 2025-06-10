import type { MetaRecord } from "nextra";

function open(title: string) {
  return {
    title,
    theme: {
      collapsed: false,
    },
  };
}

const meta: MetaRecord = {
  index: "🚀 Getting Started",
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
  roadmap: "📅 Roadmap",
  related: open("📊 Related Projects"),
  api: {
    title: "⇲ API Documents",
    href: "/api",
  },
};
export default meta;
