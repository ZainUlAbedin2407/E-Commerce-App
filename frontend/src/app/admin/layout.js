import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { isDbConfigured } from "@/lib/mongodb";
import AdminShell from "@/components/AdminShell";

// Server guard: when the database is configured, only a signed-in admin
// may enter /admin — everyone else goes to /login. When the database is
// NOT configured yet (Phase 1 preview), there is no session to check, so
// the panel still renders — with a "DB not connected" note — instead of
// locking Zain out of his own preview.
export default async function AdminLayout({ children }) {
  const configured = isDbConfigured();
  if (configured) {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      redirect("/login?next=/admin");
    }
  }
  return <AdminShell dbConfigured={configured}>{children}</AdminShell>;
}
