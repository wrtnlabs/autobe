"use client";

import { useEffect, useState } from "react";

import FadeIn from "./FadeIn";

interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  ogImage?: string;
  tags: string[];
}

export default function AutoBeLandingBlogMovie() {
  const [posts, setPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    fetch("/blog-summary.json")
      .then((r) => r.json())
      .then((data) => setPosts(data.slice(0, 3)))
      .catch(() => {});
  }, []);

  if (posts.length === 0) return null;

  return (
    <section className="py-40 px-6 bg-neutral-950">
      <div className="max-w-5xl mx-auto">
        <FadeIn className="max-w-xl mb-16">
          <p className="text-xs font-medium tracking-[0.3em] uppercase text-neutral-600 mb-6">
            Blog
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight leading-[1.1] mb-5">
            Latest articles
          </h2>
          <p className="text-base text-neutral-500 leading-relaxed">
            Engineering deep dives, benchmark results, and updates from the
            AutoBE team.
          </p>
        </FadeIn>

        <FadeIn delay={150}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {posts.map((post) => (
              <a
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group block rounded-xl border border-neutral-800/50 bg-neutral-900/30 overflow-hidden transition-all duration-300 hover:border-neutral-700 hover:bg-neutral-900/60"
              >
                {post.ogImage && (
                  <div className="aspect-[16/9] overflow-hidden">
                    <img
                      src={post.ogImage}
                      alt={post.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                )}
                <div className="p-5">
                  <p className="text-xs text-neutral-600 mb-2">
                    {new Date(post.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                  <h3 className="text-sm font-semibold text-white leading-snug mb-2 line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-xs text-neutral-500 leading-relaxed line-clamp-2">
                    {post.description}
                  </p>
                  {post.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {post.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] text-neutral-600 bg-neutral-800/50 px-2 py-0.5 rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </a>
            ))}
          </div>

          <div className="mt-10 text-center">
            <a
              href="/blog"
              className="text-sm text-neutral-500 hover:text-white transition-colors"
            >
              View all articles →
            </a>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
