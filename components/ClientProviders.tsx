'use client';

import { StackProvider } from "@stackframe/stack";
import { stackServerApp } from "@/lib/stack";
import { ReactNode } from "react";

export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <StackProvider app={stackServerApp}>
      {children}
    </StackProvider>
  );
}

