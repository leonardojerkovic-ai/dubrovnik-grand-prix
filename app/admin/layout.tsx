import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import type { Metadata } from "next";
import { authOptions } from "@/lib/auth";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

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
          <Link href="/admin/players" className="hover:text-crimson">
            Igrači
          </Link>
          <Link href="/admin/ratings" className="hover:text-crimson">
            Rejtinzi
          </Link>
          <Link href="/admin/seasons" className="hover:text-crimson">
            Sezone
          </Link>
          <Link href="/admin/tournaments" className="hover:text-crimson">
            Turniri
          </Link>
          <Link href="/admin/announcements" className="hover:text-crimson">
            Najave
          </Link>
          <Link href="/admin/documents" className="hover:text-crimson">
            Dokumenti
          </Link>
          <Link href="/admin/hall-of-fame" className="hover:text-crimson">
            Hall of Fame
          </Link>
          <Link href="/admin/users" className="hover:text-crimson">
            Korisnici
          </Link>
          <Link href="/admin/novcane-nagrade" className="hover:text-crimson">
            Novčane nagrade
          </Link>
          <Link href="/admin/pregled-sezone" className="hover:text-crimson">
            Pregled sezone
          </Link>
          <Link href="/admin/pristupni-kodovi" className="hover:text-crimson">
            Pristupni kodovi
          </Link>
          <Link href="/admin/skrbnistva" className="hover:text-crimson">
            Skrbništva
          </Link>
          <Link href="/admin/audit" className="hover:text-crimson">
            Trag izmjena
          </Link>
        </nav>
      </div>
      {children}
    </div>
  );
}
