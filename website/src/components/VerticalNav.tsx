"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const NAV_ITEMS = [
  { href: "/docs", label: "Guide Documents", icon: "📖" },
  { href: "/blog", label: "Blog Articles", icon: "📝" },
  { href: "/benchmark/index.html", label: "Benchmark", icon: "📊" },
];

export default function VerticalNav() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Persist collapsed state
  useEffect(() => {
    const saved = localStorage.getItem("vertical-nav-collapsed");
    if (saved === "true") setCollapsed(true);
  }, []);

  const toggleCollapsed = useCallback((value: boolean) => {
    setCollapsed(value);
    localStorage.setItem("vertical-nav-collapsed", String(value));
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        className="vertical-nav__mobile-toggle"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle navigation"
      >
        {mobileOpen ? "✕" : "☰"}
      </button>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="vertical-nav__backdrop"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <nav
        className={[
          "vertical-nav",
          collapsed ? "vertical-nav--collapsed" : "",
          mobileOpen ? "vertical-nav--open" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className="vertical-nav__header">
          {collapsed ? (
            <button
              onClick={() => toggleCollapsed(false)}
              className="vertical-nav__logo"
              aria-label="Expand sidebar"
              style={{ background: "none", border: "none", cursor: "pointer" }}
            >
              <strong>AB</strong>
            </button>
          ) : (
            <>
              <a href="/" className="vertical-nav__logo">
                <strong>AutoBE</strong>
              </a>
              <button
                onClick={() => toggleCollapsed(true)}
                className="vertical-nav__toggle"
                aria-label="Collapse sidebar"
              >
                ◀
              </button>
            </>
          )}
        </div>

        <ul className="vertical-nav__list">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/benchmark/index.html"
                ? pathname.startsWith("/benchmark")
                : pathname.startsWith(item.href);

            return (
              <li key={item.href}>
                <a
                  href={item.href}
                  className={`vertical-nav__link ${isActive ? "vertical-nav__link--active" : ""}`}
                >
                  <span className="vertical-nav__icon">{item.icon}</span>
                  {!collapsed && (
                    <span className="vertical-nav__label">{item.label}</span>
                  )}
                </a>
              </li>
            );
          })}
        </ul>

        <div className="vertical-nav__footer">
          <a
            href="https://github.com/wrtnlabs/autobe"
            target="_blank"
            rel="noopener noreferrer"
            className="vertical-nav__link"
          >
            <span className="vertical-nav__icon">
              <svg
                width="16"
                height="16"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
              </svg>
            </span>
            {!collapsed && <span className="vertical-nav__label">GitHub</span>}
          </a>
        </div>
      </nav>
    </>
  );
}
