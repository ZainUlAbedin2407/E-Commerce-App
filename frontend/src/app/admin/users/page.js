"use client";

import { useEffect, useState } from "react";
import { Notice } from "@/components/AdminUI";

export default function UserManagementPage() {
  const [users, setUsers] = useState(null);
  const [dbConnected, setDbConnected] = useState(false);
  const [me, setMe] = useState(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user) setMe(data.user);
      })
      .catch(() => {});
    fetch("/api/admin/users")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.users) {
          setUsers(data.users);
          setDbConnected(true);
        } else {
          setUsers([]);
        }
      })
      .catch(() => setUsers([]));
  }, []);

  const changeRole = async (u, role) => {
    if (u.role === role) return;
    setNotice("");
    const res = await fetch(`/api/admin/users/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setNotice(data.error || "Could not change the role.");
      return;
    }
    setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, role } : x)));
    setNotice(`${u.name} is now ${role}.`);
  };

  return (
    <div className="mx-auto max-w-7xl">
      <h2 className="mb-2 font-display text-2xl font-bold text-ink">Users</h2>
      <p className="mb-6 text-sm text-muted">
        {dbConnected
          ? "Registered customers and admins. Passwords are never shown here. Admins are created only by the make-admin script, never by a customer signing up. Register always creates a customer account."
          : "Database not connected. Accounts are disabled until it is configured."}
      </p>
      <Notice kind={notice.includes("Could not") ? "error" : "success"}>{notice}</Notice>
      <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
        <table className="min-w-full text-left text-sm text-muted">
          <thead className="whitespace-nowrap text-ink">
            <tr className="border-b border-line">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users === null ? (
              <tr>
                <td colSpan={5} className="p-4 text-center">Loading...</td>
              </tr>
            ) : users.length > 0 ? (
              users.map((u) => {
                const isSelf = me && u.id === me.id;
                return (
                  <tr key={u.id || u.email} className="border-b border-line align-top last:border-0">
                    <td className="p-4 font-medium text-ink">{u.name}</td>
                    <td className="p-4">{u.email}</td>
                    <td className="p-4">{u.phone || "Not set"}</td>
                    <td className="p-4">
                      <select
                        value={u.role}
                        disabled={isSelf}
                        title={isSelf ? "You cannot change your own role." : "Change role"}
                        onChange={(e) => changeRole(u, e.target.value)}
                        className={`min-h-11 cursor-pointer rounded-xl border border-line bg-raised px-2 py-1 text-sm font-medium text-ink disabled:cursor-not-allowed disabled:opacity-60 ${u.role === "admin" ? "font-bold text-battery" : ""}`}
                      >
                        <option value="customer">customer</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td className="p-4">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "Not set"}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="p-4 text-center">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
