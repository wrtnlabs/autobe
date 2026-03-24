import Link from "next/link";

function formatDate(date) {
  const value = date ? new Date(date) : null;
  return Number.isNaN(value?.getTime?.()) ? null : value.toLocaleDateString();
}

export default function BlogPostCard({ post }) {
  const { frontMatter } = post;
  const tags = frontMatter.tags ?? [];
  const date = formatDate(frontMatter.date);

  return (
    <Link href={post.route} className="autobe-blog-card">
      <img
        src={frontMatter.ogImage ?? "/og.jpg"}
        alt={frontMatter.title ?? "Blog cover image"}
        className="autobe-blog-card-image"
      />
      <div className="autobe-blog-card-body">
        <h2 className="autobe-blog-card-title">{frontMatter.title}</h2>
        {frontMatter.description ? (
          <p className="autobe-blog-card-description">{frontMatter.description}</p>
        ) : null}
        {tags.length ? (
          <div className="autobe-blog-card-tags">
            {tags.slice(0, 4).map((tag) => (
              <span key={tag}>#{tag}</span>
            ))}
          </div>
        ) : null}
        <div className="autobe-blog-card-meta">
          {date ? <span>{date}</span> : null}
          {frontMatter.author ? <span>{frontMatter.author}</span> : null}
        </div>
      </div>
    </Link>
  );
}
