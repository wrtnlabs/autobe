"use client";

import { useEffect } from "react";

export default function BenchmarkLayout({ children }) {
  useEffect(() => {
    document.body.classList.add("benchmark-page");
    return () => document.body.classList.remove("benchmark-page");
  }, []);

  return <>{children}</>;
}
