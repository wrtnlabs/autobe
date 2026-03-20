import { Footer, Layout, Navbar } from "nextra-theme-docs";
import { getPageMap } from "nextra/page-map";

const navbar = (
  <Navbar
    logo={<b>AutoBE</b>}
    projectLink="https://github.com/wrtnlabs/autobe"
  />
);

const footer = <Footer>Wrtn Technologies.</Footer>;

export default async function DocsLayout(props) {
  return (
    <Layout
      navbar={navbar}
      pageMap={await getPageMap()}
      docsRepositoryBase="https://github.com/wrtnlabs/autobe/tree/main/website"
      editLink="Edit this page on GitHub"
      sidebar={{ autoCollapse: false }}
      nextThemes={{
        defaultTheme: "dark",
      }}
      darkMode={false}
      footer={footer}
    >
      {props.children}
    </Layout>
  );
}

