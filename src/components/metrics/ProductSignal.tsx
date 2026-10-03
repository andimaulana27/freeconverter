"use client";

import { useEffect } from "react";

export function ProductSignal({
  path,
  keyName,
  href,
  children,
  className,
}: {
  path: string;
  keyName: "guide_view" | "tool_start" | "guide_tool_click";
  href?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  useEffect(() => {
    if (keyName !== "guide_view" && keyName !== "tool_start") return;
    const onceKey = `ayc-metric:${keyName}:${path}`;
    if (sessionStorage.getItem(onceKey)) return;
    sessionStorage.setItem(onceKey, "1");
    void fetch("/api/metrics/event", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ path, key: keyName }),
      keepalive: true,
    });
  }, [keyName, path]);

  if (!href) return null;

  return (
    <a
      href={href}
      className={className}
      onClick={() => {
        void fetch("/api/metrics/event", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ path, key: keyName }),
          keepalive: true,
        });
      }}
    >
      {children}
    </a>
  );
}
