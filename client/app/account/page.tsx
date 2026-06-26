"use client";

import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth-guard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";

function AccountContent() {
  const { user, logout } = useAuth();
  const router = useRouter();

  if (!user) return null;

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
      <Card>
        <CardHeader>
          <h1 className="text-xl font-bold text-zinc-100">My account</h1>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-500">Username</span>
            <span className="font-medium text-zinc-100">{user.username}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-500">Email</span>
            <span className="font-medium text-zinc-100">{user.email}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-500">Role</span>
            <Badge variant={user.role === "Admin" ? "accent" : "default"}>
              {user.role}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-500">Verified</span>
            <Badge variant={user.verified ? "success" : "warning"}>
              {user.verified ? "Yes" : "No"}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-500">Member since</span>
            <span className="text-sm text-zinc-300">
              {new Date(user.createdAt).toLocaleDateString()}
            </span>
          </div>
          <Button variant="danger" className="w-full" onClick={handleLogout}>
            Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AccountPage() {
  return (
    <AuthGuard>
      <AccountContent />
    </AuthGuard>
  );
}
