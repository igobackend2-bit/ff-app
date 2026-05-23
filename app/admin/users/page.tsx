'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, RefreshCw, ChevronLeft, ChevronRight, Users, MapPin, ChevronDown, ChevronUp } from 'lucide-react';

interface AddressRow {
  id: string; label: string; line1: string; city: string; state: string; pincode: string; isDefault: boolean;
}

interface UserRow {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  createdAt: string;
  loyaltyPoints: number;
  _count: { orders: number };
  addresses: AddressRow[];
}

export default function AdminUsersPage() {
  const [users, setUsers]     = useState<UserRow[]>([]);
  const [total, setTotal]     = useState(0);
  const [pages, setPages]     = useState(1);
  const [page, setPage]       = useState(1);
  const [search, setSearch]   = useState('');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('q', search);
      const res  = await fetch(`/api/admin/users?${params}`);
      const data = await res.json() as { users: UserRow[]; total: number; pages: number };
      setUsers(data.users ?? []);
      setTotal(data.total ?? 0);
      setPages(data.pages ?? 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { void fetchUsers(); }, [fetchUsers]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); void fetchUsers(); };

  const initials = (name: string | null, phone: string | null) => {
    if (name) return name.trim().split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
    if (phone) return phone.slice(-2);
    return '?';
  };

  const COLORS = ['bg-emerald-500', 'bg-violet-500', 'bg-blue-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500'];
  const avatarColor = (id: string) => COLORS[id.charCodeAt(0) % COLORS.length] ?? COLORS[0];

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-neutral-900">Users</h1>
          <p className="mt-0.5 text-sm text-neutral-500">{total} registered customers</p>
        </div>
        <button onClick={() => void fetchUsers()} className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-600 hover:bg-neutral-50">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-4 flex gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 shadow-sm">
          <Search className="h-4 w-4 text-neutral-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="flex-1 bg-transparent text-sm text-neutral-700 outline-none placeholder:text-neutral-400"
          />
        </div>
        <button type="submit" className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-bold text-white hover:bg-primary-700">
          Search
        </button>
      </form>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-neutral-100" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-2xl border border-neutral-100 bg-white p-10 text-center">
          <Users className="mx-auto mb-3 h-10 w-10 text-neutral-300" />
          <p className="text-neutral-500">No users found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {users.map((user) => (
            <div key={user.id} className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm">
              {/* User row */}
              <div className="flex items-center gap-4 px-4 py-3.5">
                {/* Avatar */}
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black text-white ${avatarColor(user.id)}`}>
                  {initials(user.name, user.phone)}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-neutral-900">{user.name ?? 'Guest'}</p>
                  <p className="truncate text-xs text-neutral-500">{user.phone ?? ''} {user.email ? (user.phone ? '· ' : '') + user.email : ''}</p>
                </div>

                {/* Stats */}
                <div className="hidden items-center gap-6 sm:flex">
                  <div className="text-center">
                    <p className="text-sm font-black text-neutral-900">{user._count.orders}</p>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Orders</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-black text-neutral-900">{user.addresses.length}</p>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Addresses</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-black text-primary-700">{user.loyaltyPoints}</p>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Points</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-neutral-600">{new Date(user.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Joined</p>
                  </div>
                </div>

                {/* Expand addresses toggle */}
                {user.addresses.length > 0 && (
                  <button
                    onClick={() => setExpanded(expanded === user.id ? null : user.id)}
                    className="flex items-center gap-1 rounded-lg border border-neutral-200 px-2 py-1.5 text-xs font-bold text-neutral-600 hover:bg-neutral-50"
                  >
                    <MapPin className="h-3.5 w-3.5 text-primary-500" />
                    {user.addresses.length}
                    {expanded === user.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>
                )}
              </div>

              {/* Expanded addresses */}
              {expanded === user.id && user.addresses.length > 0 && (
                <div className="border-t border-neutral-100 bg-neutral-50 px-4 py-3">
                  <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-neutral-400">Saved Addresses</p>
                  <div className="space-y-2">
                    {user.addresses.map((addr) => (
                      <div key={addr.id} className="flex items-start gap-2.5 rounded-xl bg-white px-3 py-2.5 border border-neutral-100">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary-500" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-neutral-700">{addr.label}</span>
                            {addr.isDefault && (
                              <span className="rounded-full bg-primary-100 px-1.5 py-0.5 text-[9px] font-bold text-primary-700">Default</span>
                            )}
                          </div>
                          <p className="text-xs text-neutral-600 truncate">{addr.line1}</p>
                          <p className="text-xs text-neutral-400">{addr.city}, {addr.state} - {addr.pincode}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-neutral-500">Page {page} of {pages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="flex items-center gap-1 rounded-xl border border-neutral-200 px-3 py-2 text-sm font-semibold text-neutral-600 hover:bg-neutral-50 disabled:opacity-50">
              <ChevronLeft className="h-4 w-4" /> Prev
            </button>
            <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages}
              className="flex items-center gap-1 rounded-xl border border-neutral-200 px-3 py-2 text-sm font-semibold text-neutral-600 hover:bg-neutral-50 disabled:opacity-50">
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
