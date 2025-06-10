import type { MetaRecord } from "nextra";

const meta: MetaRecord = {
  index: {
    type: "page",
    title: "Introduction",
    display: "hidden",
  },
  docs: {
    type: "page",
    title: "📖 Guide Documents",
  },
  demo: {
    type: "page",
    title: "📚 Demonstrations",
  },
  playground: {
    type: "page",
    title: "💻 Playground",
    href: "https://stackblitz.com/github/wrtnlabs/autobe-playground-stackblitz",
  },
};
export default meta;
