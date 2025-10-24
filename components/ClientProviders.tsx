'use client';

import { StackProvider } from "@stackframe/stack";
import { stackClientApp } from "@/lib/stack-client";
import { ReactNode } from "react";

export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <StackProvider app={stackClientApp}>
      {children}
    </StackProvider>
  );
}

