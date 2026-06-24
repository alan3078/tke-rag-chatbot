"use client";

import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/use-session";
import { Loader2 } from "lucide-react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data, isLoading } = useSession();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data?.authenticated) {
    router.push("/login");
    return null;
  }

  return <>{children}</>;
}
