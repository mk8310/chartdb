import React, { useEffect, useState } from 'react';

interface User {
  id: number;
  email: string;
  is_admin: boolean;
}

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token') ?? '';
    fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.ok ? res.json() : [])
      .then(setUsers)
      .catch(() => {});
  }, []);

  return (
    <section className="p-4">
      <h1 className="text-xl font-bold mb-2">Users</h1>
      <ul>
        {users.map((u) => (
          <li key={u.id} className="py-1">
            {u.email} {u.is_admin ? '(admin)' : ''}
          </li>
        ))}
      </ul>
    </section>
  );
};
