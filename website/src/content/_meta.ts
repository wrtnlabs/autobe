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
    type: "menu",
    title: "📚 Demonstrations",
    items: {
      bbs: {
        title: "Bullet-in Board System",
        href: "https://stackblitz.com/github/wrtnlabs/autobe-example-bbs",
      },
      shopping: {
        title: "Shopping Mall",
        href: "https://stackblitz.com/github/wrtnlabs/autobe-example-shopping",
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
