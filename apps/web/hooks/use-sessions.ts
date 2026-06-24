"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getJson, postJson, deleteRequest } from "@/services/api-client";
import type { SessionSummary } from "@/types";

const SESSIONS_KEY = ["sessions"];

export function useSessions() {
  return useQuery<SessionSummary[]>({
    queryKey: SESSIONS_KEY,
    queryFn: () => getJson<SessionSummary[]>("/api/sessions"),
    staleTime: 30_000,
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (title?: string) =>
      postJson<{ id: string; title: string }, { title?: string }>("/api/sessions", { title }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SESSIONS_KEY }),
  });
}

export function useDeleteSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteRequest<{ success: boolean }>(`/api/sessions/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SESSIONS_KEY }),
  });
}

export function useInvalidateSessions() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: SESSIONS_KEY });
}
