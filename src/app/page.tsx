import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <header className="border-b border-zinc-800">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <span className="text-xl font-bold text-white">waPoint</span>
          <div className="flex gap-4">
            <Link
              href="/super-admin/login"
              className="text-sm text-zinc-400 hover:text-white transition-colors"
            >
              Admin
            </Link>
            <Link
              href="/barber/login"
              className="text-sm text-zinc-400 hover:text-white transition-colors"
            >
              Barber Login
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center">
        <div className="max-w-lg space-y-6">
          <h1 className="text-4xl font-bold tracking-tight text-white">
            AI-Powered Barber Booking
          </h1>
          <p className="text-lg text-zinc-400 leading-relaxed">
            Manage appointments, connect WhatsApp, and let AI handle your
            bookings — all in one platform.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Link
              href="/super-admin/login"
              className="inline-flex h-10 px-6 items-center rounded-lg bg-white text-zinc-900 text-sm font-medium hover:bg-zinc-200 transition-colors"
            >
              Get Started
            </Link>
            <Link
              href="https://github.com/anomalyco/opencode"
              className="inline-flex h-10 px-6 items-center rounded-lg border border-zinc-800 text-zinc-400 text-sm font-medium hover:text-white transition-colors"
            >
              GitHub
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-zinc-800 py-6">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-zinc-600">
          waPoint &copy; {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}
