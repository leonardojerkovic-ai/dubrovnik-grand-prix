import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (!session || (role !== "ADMIN" && role !== "GP_MANAGER")) {
    redirect("/prijava?callbackUrl=/admin");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center gap-4 border-b border-navy/10 pb-4">
        <h1 className="font-display text-xl font-bold text-navy">Admin</h1>
        <nav className="flex gap-4 text-sm text-ink/70">
          <a href="/admin/players" className="hover:text-crimson">
            Igrači
          </a>
          <a href="/admin/ratings" className="hover:text-crimson">
            Rejtinzi
          </a>
          <a href="/admin/seasons" className="hover:text-crimson">
            Sezone
          </a>
          <a href="/admin/tournaments" className="hover:text-crimson">
            Turniri
          </a>
          <a href="/admin/documents" className="hover:text-crimson">
            Dokumenti
          </a>
          <a href="/admin/hall-of-fame" className="hover:text-crimson">
            Hall of Fame
          </a>
        </nav>
      </div>
      {children}
    </div>
  );
}
