import React, { useState } from "react";

const UserManagement = () => {
  const users = [
    {
      name: "John Doe",
      email: "john@example.com",
      role: "admin",
    },
  ];

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "customer", // Default Role
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };
  return (
    <div className="max-w-7xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">User Management</h2>
      {/* Add new user form */}
      <div className="p-6 mb-6 rounded-lg">
        <h3 className="text-lg font-bold mb-4">Add New User</h3>
        <form>
          <div className="mb-4">
            <label className="block text-gray-700">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserManagement;
