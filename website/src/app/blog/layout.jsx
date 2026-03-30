import "nextra-theme-blog/style.css";
import "./blog.css";
import { Footer, Layout } from "nextra-theme-blog";

export const metadata = {
  title: "Blog",
  description: "Engineering notes, releases, and deep dives from AutoBE.",
};

export default async function BlogLayout(props) {
  return (
    <div className="blog-page">
      <Layout
        nextThemes={{
          defaultTheme: "dark",
        }}
      >
        {props.children}
        <Footer>
        Released under the AGPL-3.0 License. Copyright 2024 - {new Date().getFullYear()}{" "}
        <a href="https://github.com/wrtnlabs" target="_blank" style={{ color: "inherit" }}>
          Wrtn Technologies
        </a>
        .
      </Footer>
    </Layout>
    </div>
  );
}
