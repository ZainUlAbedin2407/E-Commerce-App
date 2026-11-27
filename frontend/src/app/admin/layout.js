import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { connectDB, isDbConfigured } from "@/lib/mongodb";
import User from "@/models/User";
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
    // Audit M2: re-check the live role in the database — a demoted admin
    // must not see the panel. The redirect stays OUTSIDE the try/catch
    // (redirect() works by throwing, and the catch must not swallow it).
    // If the DB is unreachable here, the token role stands and the API
    // routes enforce the DB role on every mutation (they 503 in that case).
    let dbRole = null;
    let dbError = false;
    try {
      await connectDB();
      const dbUser = await User.findById(session.id).select("role").lean();
      dbRole = dbUser?.role || null;
    } catch {
      dbError = true;
    }
    if (!dbError && dbRole !== "admin") {
      redirect("/login?next=/admin");
    }
  }
  return <AdminShell dbConfigured={configured}>{children}</AdminShell>;
}
