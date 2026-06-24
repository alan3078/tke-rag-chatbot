"use client";

import { useQuery } from "@tanstack/react-query";

interface SessionResponse {
  authenticated: boolean;
  username: string | null;
}

async function fetchSession(): Promise<SessionResponse> {
  const res = await fetch("/api/auth/session");
  return res.json();
}

export function useSession() {
  return useQuery({
    queryKey: ["session"],
    queryFn: fetchSession,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
