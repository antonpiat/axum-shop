"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { user, loading, isAdmin, logout } = useAuth();
  const pathname = usePathname();

  const linkClass = (href: string) =>
    cn(
      "text-sm font-medium transition-colors hover:text-emerald-400",
      pathname === href ? "text-emerald-400" : "text-zinc-400",
    );

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-lg font-bold tracking-tight text-zinc-100">
            Axum<span className="text-emerald-500">Shop</span>
          </Link>
          <nav className="hidden items-center gap-6 sm:flex">
            <Link href="/" className={linkClass("/")}>
              Shop
            </Link>
            {isAdmin && (
              <Link href="/admin/products" className={linkClass("/admin/products")}>
                Admin
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {loading ? (
            <div className="h-9 w-20 animate-pulse rounded-lg bg-zinc-800" />
          ) : user ? (
            <>
              <Link href="/account" className={cn(linkClass("/account"), "px-2")}>
                {user.username}
              </Link>
              <Button variant="ghost" size="sm" onClick={() => logout()}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Register</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
