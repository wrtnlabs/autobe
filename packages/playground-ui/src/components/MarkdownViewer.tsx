import Markdown from "react-markdown";

// import rehypeRaw from "rehype-raw";
// import rehypeStringify from "rehype-stringify";
// import remarkMermaidPlugin from "remark-mermaid-plugin";

export function MarkdownViewer(props: MarkdownViewer.IProps) {
  try {
    return (
      <Markdown
        components={{
          img: ({ ...props }) => (
            <img
              {...props}
              style={{
                display: "block",
                maxWidth: "100%",
                height: "auto",
              }}
            />
          ),
        }}
      >
        {props.children}
      </Markdown>
    );
  } catch {
    return (
      <>
        <Markdown>
          {"> Markdown syntax error. Please leave a issue on Github."}
        </Markdown>
        <br />
        <br />
        <pre>{props.children}</pre>
      </>
    );
  }
}
export namespace MarkdownViewer {
  export interface IProps {
    children: string | null | undefined;
  }
}
