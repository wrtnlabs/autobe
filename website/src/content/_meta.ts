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
    display: "hidden",
  },
  "blog-articles": {
    type: "page",
    title: "📝 Blog Articles",
    href: "/blog",
  },
  benchmark: {
    type: "page",
    title: "📊 Estimate",
    theme: {
      layout: "full",
      toc: false,
    },
  },
  // Demonstrations removed — examples available on GitHub
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
