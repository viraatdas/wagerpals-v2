'use client';
import { StackClientApp } from "@stackframe/stack";

export const stackClientApp = new StackClientApp({
  tokenStore: "nextjs-cookie",
  urls: {
    signIn: "/auth/signin",
    afterSignIn: "/",
    afterSignOut: "/auth/signin",
  },
  // Critical for OAuth to work properly with shared links
  baseUrl: process.env.NEXT_PUBLIC_APP_URL,
});

