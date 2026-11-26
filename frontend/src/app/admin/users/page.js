"use client";

import { useEffect, useState } from "react";

export default function UserManagementPage() {
  const [users, setUsers] = useState(null);
  const [dbConnected, setDbConnected] = useState(false);

  useEffect(() => {
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

  return (
    <div className="mx-auto max-w-7xl">
      <h2 className="mb-2 font-display text-2xl font-bold">User Management</h2>
      <p className="mb-6 text-sm text-gray-600">
        {dbConnected
          ? "Registered customers and admins. Passwords are never shown here."
          : "Database not connected — accounts are disabled until it is configured. The shop works for guests with Cash on Delivery until then."}
      </p>
      <div className="overflow-x-auto shadow-md sm:rounded-lg">
        <table className="min-w-full text-left text-gray-500">
          <thead className="bg-gray-100 text-xs uppercase whitespace-nowrap text-gray-700">
            <tr>
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
                <td colSpan={5} className="p-4 text-center text-gray-500">Loading…</td>
              </tr>
            ) : users.length > 0 ? (
              users.map((u) => (
                <tr key={u._id || u.email} className="border-b border-gray-200 align-top hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-900">{u.name}</td>
                  <td className="p-4">{u.email}</td>
                  <td className="p-4">{u.phone || "—"}</td>
                  <td className="p-4">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${u.role === "admin" ? "bg-brand-orange/15 text-brand-orange" : "bg-gray-100 text-gray-700"}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">
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
