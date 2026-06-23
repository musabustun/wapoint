import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Scissors, Clock, Settings, LayoutDashboard, LogOut } from "lucide-react";

async function signOutAction() {
  "use server";
  const { signOut } = await import("@/lib/auth");
  await signOut({ redirectTo: "/barber/login" });
}

export default async function BarberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const user = session?.user as { name?: string; role?: string; slug?: string } | undefined;

  if (!user || user.role !== "barber") {
    redirect("/barber/login");
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      <aside className="w-64 border-r border-zinc-800 bg-zinc-900 flex flex-col">
        <div className="p-6 border-b border-zinc-800">
          <h1 className="text-xl font-bold text-white">waPoint</h1>
          <p className="text-sm text-zinc-500">{user.name}</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <Link
            href="/barber"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Dashboard</span>
          </Link>
          <Link
            href="/barber/services"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <Scissors className="w-5 h-5" />
            <span>Services</span>
          </Link>
          <Link
            href="/barber/availability"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <Clock className="w-5 h-5" />
            <span>Working Hours</span>
          </Link>
          <Link
            href={`/${user.slug}`}
            target="_blank"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <Settings className="w-5 h-5" />
            <span>Booking Page</span>
          </Link>
        </nav>
        <div className="p-4 border-t border-zinc-800">
          <form action={signOutAction}>
            <button
              type="submit"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors w-full"
            >
              <LogOut className="w-5 h-5" />
              <span>Sign out</span>
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
