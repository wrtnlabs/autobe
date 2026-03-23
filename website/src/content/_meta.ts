import type { MetaRecord } from "nextra";

const meta: MetaRecord = {
  index: {
    type: "page",
    title: "Introduction",
    display: "hidden",
    theme: {
      layout: "full",
      toc: false,
    },
  },
  docs: {
    type: "page",
    title: "📖 Guide Documents",
  },
  tutorial: {
    display: "hidden",
  },
  blog: {
    type: "page",
    title: "📝 Blog Articles",
  },
  demo: {
    type: "page",
    title: "📚 Demonstrations",
    href: "https://github.com/wrtnlabs/autobe-examples",
  },
  screenshot: {
    type: "page",
    title: "Screenshot",
    display: "hidden",
    theme: {
      layout: "full",
      toc: false,
    },
  },
};
export default meta;
