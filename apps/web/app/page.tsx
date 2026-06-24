"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data: { authenticated: boolean }) => {
        router.push(data.authenticated ? "/chat" : "/login");
      })
      .catch(() => router.push("/login"));
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}
