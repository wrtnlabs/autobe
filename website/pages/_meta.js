export default {
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
        newWindow: true,
      },
      shopping: {
        title: "Shopping Mall",
        href: "https://stackblitz.com/github/wrtnlabs/autobe-example-shopping",
        newWindow: true,
      },
    },
  },
  playground: {
    type: "page",
    title: "💻 Playground",
    href: "https://stackblitz.com/github/wrtnlabs/autobe-playground-stackblitz",
    newWindow: true,
  },
};
