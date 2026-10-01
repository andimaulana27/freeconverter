"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type ConvertSessionValue = {
  files: File[];
  setFiles: (files: File[]) => void;
  clearFiles: () => void;
};

const ConvertSessionContext = createContext<ConvertSessionValue | null>(null);

export function ConvertSessionProvider({ children }: { children: ReactNode }) {
  const [files, setFiles] = useState<File[]>([]);
  const clearFiles = useCallback(() => setFiles([]), []);
  const value = useMemo(() => ({ files, setFiles, clearFiles }), [files, clearFiles]);
  return <ConvertSessionContext.Provider value={value}>{children}</ConvertSessionContext.Provider>;
}

export function useConvertSession() {
  const session = useContext(ConvertSessionContext);
  if (!session) {
    throw new Error("ConvertSessionProvider is missing.");
  }
  return session;
}
