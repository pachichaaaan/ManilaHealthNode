import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { MobileNav, Sidebar } from "@/components/app-nav";
import { Topbar } from "@/components/topbar";
import { AmbientBackground } from "@/components/ambient-background";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-dvh">
      <AmbientBackground />
      <Sidebar role={session.role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar user={session} />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-12">
          {children}
        </main>
        <MobileNav role={session.role} />
      </div>
    </div>
  );
}
