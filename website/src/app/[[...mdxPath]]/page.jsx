import { generateStaticParamsFor, importPage } from "nextra/pages";

import { useMDXComponents as getMDXComponents } from "../../../mdx-components";

const CUSTOM_ROUTES = new Set(["benchmark"]);

export async function generateStaticParams() {
  const params = await generateStaticParamsFor("mdxPath")();
  return params.filter(
    (p) => !p.mdxPath?.length || !CUSTOM_ROUTES.has(p.mdxPath[0]),
  );
}

export async function generateMetadata(props) {
  const params = await props.params;

  const { metadata } = await importPage(params.mdxPath);
  return metadata;
}

const Wrapper = getMDXComponents().wrapper;

export default async function Page(props) {
  const params = await props.params;

  const result = await importPage(params.mdxPath);
  const { default: MDXContent, toc, metadata } = result;

  return (
    <Wrapper toc={toc} metadata={metadata}>
      <MDXContent {...props} params={params} />
    </Wrapper>
  );
}
