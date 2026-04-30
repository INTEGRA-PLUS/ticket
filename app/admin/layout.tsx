import Link from "next/link";

import { getOptionalSession } from "@/lib/auth/dal";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getOptionalSession();

  return (
    <div className="flex min-h-svh flex-col">
      {session ? (
        <header className="border-b bg-card">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3">
            <Link href="/admin" className="font-semibold tracking-tight">
              Ticket Admin
            </Link>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-muted-foreground">{session.email}</span>
            </div>
          </div>
        </header>
      ) : null}
      <div className="flex-1">{children}</div>
    </div>
  );
}
