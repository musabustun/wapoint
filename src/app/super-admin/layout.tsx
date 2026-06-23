import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LogOut, Store, Settings } from "lucide-react";

async function signOutAction() {
  "use server";
  const { signOut } = await import("@/lib/auth");
  await signOut({ redirectTo: "/super-admin/login" });
}

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/super-admin/login");
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      <aside className="w-64 border-r border-zinc-800 bg-zinc-900 flex flex-col">
        <div className="p-6 border-b border-zinc-800">
          <h1 className="text-xl font-bold text-white">waPoint</h1>
          <p className="text-sm text-zinc-500">Super Admin</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <Link
            href="/super-admin"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <Store className="w-5 h-5" />
            <span>Barbers</span>
          </Link>
          <Link
            href="/super-admin/settings"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <Settings className="w-5 h-5" />
            <span>LLM Settings</span>
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
