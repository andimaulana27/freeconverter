"use client";

import { createContext, useContext, type ReactNode } from "react";
import { disabledAdConfig } from "@/lib/ads/empty";
import type { PublicAdConfig } from "@/lib/ads/types";

const AdConfigContext = createContext<PublicAdConfig>(disabledAdConfig());

export function AdConfigProvider({
  value,
  children,
}: {
  value: PublicAdConfig;
  children: ReactNode;
}) {
  return <AdConfigContext.Provider value={value}>{children}</AdConfigContext.Provider>;
}

export function useAdConfig() {
  return useContext(AdConfigContext);
}
