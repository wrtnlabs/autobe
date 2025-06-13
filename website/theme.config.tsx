import { DocsThemeConfig, useConfig } from "nextra-theme-docs";
import React from "react";

const description: string = "Backend Vibe Coding";
const config: DocsThemeConfig = {
  logo: () => (
    <>
      <img
        src="/autobe/favicon/android-chrome-192x192.png"
        width={32}
        height={32}
      />
      <span
        style={{
          fontWeight: "bold",
          fontSize: "1.2rem",
          paddingLeft: 15,
          paddingRight: 10,
        }}
      >
        AutoBE
      </span>
      {description}
    </>
  ),
  nextThemes: {
    defaultTheme: "dark",
  },
  project: {
    link: "https://github.com/wrtnlabs/autobe",
  },
  // chat: {
  //   link: "https://discord.gg/aMhRmzkqCx",
  // },
  docsRepositoryBase: "https://github.com/wrtnlabs/autobe/blob/main/website",
  footer: {
    content: () => (
      <span>
        Released under the MIT License.
        <br />
        <br />
        Copyright 2024 - {new Date().getFullYear()}{" "}
        <a
          href="https://github.com/wrtnlabs"
          target="_blank"
          style={{ color: "initial" }}
        >
          <u>Wrtn Technologies</u>
        </a>{" "}
        & Contributors
      </span>
    ),
  },
  head: () => {
    const config = useConfig();
    return (
      <>
        <title>{`AutoBE > ${config.title}`}</title>
        <link rel="manifest" href="/autobe/favicon/site.webmanifest" />
        {/* ICONS */}
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/autobe/favicon/apple-touch-icon.png"
        />
        {[16, 32].map((size) => (
          <link
            key={size}
            rel="icon"
            type="image/png"
            sizes={`${size}x${size}`}
            href={`/autobe/favicon/favicon-${size}x${size}.png`}
          />
        ))}
        {/* OG */}
        <meta name="og:type" content="object" />
        <meta name="og:site_name" content="AutoBE Guide Documents" />
        <meta name="og:url" content="https://wrtnlabs.io/autobe" />
        <meta name="og:image" content="https://wrtnlabs.io/autobe/og.jpg" />
        <meta name="og:title" content="AutoBE Guide Documents" />
        <meta name="og:description" content={description} />
        {/* TWITTER */}
        <meta name="twitter:card" content="summary" />
        <meta
          name="twitter:image"
          content="https://wrtnlabs.io/autobe/og.jpg"
        />
        <meta name="twitter:title" content="AutoBE Guide Documents" />
        <meta name="twitter:description" content={description} />
      </>
    );
  },
};
export default config;
