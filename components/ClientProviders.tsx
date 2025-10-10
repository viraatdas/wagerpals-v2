'use client';

import { StackProvider } from "@stackframe/stack";
import { stackClientApp } from "@/lib/stack-client";
import { ReactNode, Suspense } from "react";
import Header from "./Header";

export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <StackProvider app={stackClientApp}>
      <Suspense fallback={
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-2 sm:px-4 py-3 sm:py-4">
            <div className="flex justify-between items-center">
              <div className="text-xl sm:text-2xl font-extralight text-gray-900">
                Wager<span className="font-semibold text-orange-600">Pals</span>
              </div>
            </div>
          </div>
        </header>
      }>
        <Header />
      </Suspense>
      {children}
    </StackProvider>
  );
}

