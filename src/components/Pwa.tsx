"use client";

import { SerwistProvider } from "@serwist/next/react";
import type { ReactNode } from "react";

export function Pwa({ children }: { children: ReactNode }) {
  return (
    // reloadOnOnline={false}: por defecto Serwist recarga la página al volver la red,
    // lo que borraría un checkout a medio llenar. SyncManager ya sincroniza al volver la señal.
    <SerwistProvider
      swUrl="/sw.js"
      disable={process.env.NODE_ENV === "development"}
      reloadOnOnline={false}
    >
      {children}
    </SerwistProvider>
  );
}
