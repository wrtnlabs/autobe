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
  demo: {
    type: "menu",
    title: "📚 Demonstrations",
    items: {
      todo: {
        title: "Simple To-Do List",
        href: "https://github.com/wrtnlabs/autobe-example-todo",
      },
      reddit: {
        title: "Reddit like Community",
        href: "https://github.com/wrtnlabs/autobe-example-reddit",
      },
      bbs: {
        title: "Bullet-in Board System",
        href: "https://github.com/wrtnlabs/autobe-example-bbs",
      },
      shopping: {
        title: "Shopping Mall",
        href: "https://github.com/wrtnlabs/autobe-example-shopping",
      },
    },
  },
  playground: {
    type: "page",
    title: "💻 Playground",
    href: "https://stackblitz.com/github/wrtnlabs/autobe-playground-stackblitz",
  },
};
export default meta;
