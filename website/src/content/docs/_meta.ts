import type { MetaRecord } from "nextra";

const meta: MetaRecord = {
  index: "🙋🏻‍♂️ Introduction",
  setup: "📦 Setup",
  concepts: "🔍 Concepts",

  "-- features": {
    type: "separator",
    title: "📖 Features",
  },
  agent: "🤖 Agent Library",
  websocket: "📡 WebSocket Protocol",
  stack: "🛠️ Backend Stack",

  "-- appendix": {
    type: "separator",
    title: "🔗 Appendix",
  },
  api: {
    title: "🔧 API Documents",
    href: "/api",
  },
  ecosystem: "🌐 No-Code Ecosystem",
  roadmap: "📅 Roadmap",
  hackathon: {
    title: "🏆 Hackathon",
    display: "hidden",
  },
  seminars: "🎤 Seminars",
};
export default meta;
