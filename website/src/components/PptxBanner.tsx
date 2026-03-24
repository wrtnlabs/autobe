export default function PptxBanner(props: PptxBanner.IProps) {
  const filename = props.href.split("/").pop() ?? props.href;
  return (
    <>
      <style>{`
        .pptx-banner {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          padding: 1.25rem 1.5rem;
          margin-top: 1.25rem;
          margin-bottom: 1.75rem;
          border-radius: 12px;
          background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
          color: #f8fafc;
          text-decoration: none;
          box-shadow: 0 4px 14px rgba(0,0,0,0.15);
          transition: transform 0.2s, box-shadow 0.2s, background 0.2s, border-color 0.2s;
          border: 1px solid rgba(255,255,255,0.08);
          cursor: pointer;
        }
        .pptx-banner:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 28px rgba(0,0,0,0.35);
          background: linear-gradient(135deg, #263348 0%, #3d5068 100%);
          border-color: rgba(255,255,255,0.18);
          color: #f8fafc;
        }
        .pptx-banner:hover .pptx-arrow {
          opacity: 0.9;
        }
        .pptx-banner .pptx-icon {
          flex-shrink: 0;
          width: 64px;
          height: 64px;
          background: #D24726;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .pptx-banner .pptx-body {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .pptx-banner .pptx-title {
          font-size: 1.25rem;
          font-weight: 700;
          line-height: 1.3;
        }
        .pptx-banner .pptx-file {
          font-size: 0.8rem;
          opacity: 0.5;
          font-weight: 400;
          font-family: monospace;
        }
        .pptx-banner .pptx-arrow {
          margin-left: auto;
          font-size: 1.5rem;
          opacity: 0.4;
          flex-shrink: 0;
          transition: opacity 0.2s;
        }
      `}</style>
      <a className="pptx-banner" href={props.href} download>
        <span className="pptx-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="36"
            height="36"
            viewBox="0 0 36 36"
            fill="none"
          >
            <text
              x="18"
              y="26"
              textAnchor="middle"
              fill="white"
              fontSize="26"
              fontWeight="bold"
              fontFamily="Arial, sans-serif"
            >
              P
            </text>
          </svg>
        </span>
        <span className="pptx-body">
          <span className="pptx-title">{props.title}</span>
          <span className="pptx-file">{filename}</span>
        </span>
        <span className="pptx-arrow">↓</span>
      </a>
    </>
  );
}

export namespace PptxBanner {
  export interface IProps {
    title: string;
    href: string;
  }
}
