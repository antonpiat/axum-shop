"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/contexts/auth-context";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) router.replace("/login");
      else if (!isAdmin) router.replace("/");
    }
  }, [loading, user, isAdmin, router]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  return <>{children}</>;
}
