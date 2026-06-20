'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, Send, Trash2, RefreshCw, CheckCheck, Package, AlertCircle, Tag, Smartphone, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Notification {
  id: string; type: string; title: string; message: string;
  targetUserId: string | null; orderId: string | null;
  isAdminRead: boolean; createdAt: string;
}

interface PushToken {
  token: string; user_id: string | null; platform: string; updated_at: string;
}

const TYPE_STYLES: Record<string, string> = {
  ORDER_PLACED:  'bg-blue-100 text-blue-700 border-blue-200',
  ORDER_STATUS:  'bg-purple-100 text-purple-700 border-purple-200',
  PROMO:         'bg-green-100 text-green-700 border-green-200',
  INFO:          'bg-neutral-100 text-neutral-600 border-neutral-200',
};
const TYPE_ICONS: Record<string, React.ReactNode> = {
  ORDER_PLACED: <Package className="h-4 w-4" />,
  ORDER_STATUS: <Package className="h-4 w-4" />,
  PROMO:        <Tag className="h-4 w-4" />,
  INFO:         <AlertCircle className="h-4 w-4" />,
};

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [loading, setLoading]             = useState(true);
  const [form, setForm]                   = useState({ type: 'PROMO', title: '', message: '' });
  const [sending, setSending]             = useState(false);
  const [sendError, setSendError]         = useState('');
  const [sendOk, setSendOk]              = useState('');

  // Push notification state
  const [pushTokens, setPushTokens]             = useState<PushToken[]>([]);
  const [selectedTokens, setSelectedTokens]     = useState<Set<string>>(new Set());
  const [pushMode, setPushMode]                 = useState<'all' | 'select'>('all');
  const [pushLoading, setPushLoading]           = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/admin/notifications?limit=80');
      const data = await res.json() as { notifications: Notification[]; unreadCount: number };
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPushTokens = useCallback(async () => {
    setPushLoading(true);
    try {
      const res  = await fetch('/api/push-token');
      const data = await res.json() as { tokens: PushToken[] };
      setPushTokens(data.tokens ?? []);
    } finally {
      setPushLoading(false);
    }
  }, []);

  useEffect(() => { void fetchNotifications(); void fetchPushTokens(); }, [fetchNotifications, fetchPushTokens]);

  const markAllRead = async () => {
    await fetch('/api/admin/notifications/mark-all-read', { method: 'POST' });
    setNotifications((prev) => prev.map((n) => ({ ...n, isAdminRead: true })));
    setUnreadCount(0);
  };

  const clearRead = async () => {
    await fetch('/api/admin/notifications', { method: 'DELETE' });
    setNotifications((prev) => prev.filter((n) => !n.isAdminRead));
  };

  const sendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) { setSendError('Title and message required'); return; }
    setSendError(''); setSendOk('');
    setSending(true);
    try {
      // Determine push tokens to send to
      let tokensToSend: string[] = [];
      if (pushTokens.length > 0) {
        if (pushMode === 'all') {
          tokensToSend = pushTokens.map((t) => t.token);
        } else {
          tokensToSend = pushTokens.filter((t) => selectedTokens.has(t.token)).map((t) => t.token);
        }
      }

      const res = await fetch('/api/admin/notifications', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ ...form, pushTokens: tokensToSend }),
      });

      if (res.ok) {
        const d = await res.json() as { pushResult?: unknown };
        const pushed = tokensToSend.length;
        setSendOk(pushed > 0
          ? `Sent! Push notification delivered to ${pushed} device${pushed > 1 ? 's' : ''}.`
          : 'Notification saved. No devices registered yet.');
        setForm({ type: 'PROMO', title: '', message: '' });
        setSelectedTokens(new Set());
        void fetchNotifications();
        void d; // suppress unused warning
      } else {
        const d = await res.json() as { error?: string };
        setSendError(d.error ?? 'Failed to send');
      }
    } finally {
      setSending(false);
    }
  };

  const toggleToken = (token: string) => {
    setSelectedTokens((prev) => {
      const next = new Set(prev);
      if (next.has(token)) next.delete(token); else next.add(token);
      return next;
    });
  };

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins  = Math.floor(diff / 60000);
    if (mins < 1)   return 'just now';
    if (mins < 60)  return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs  < 24)  return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bell className="h-6 w-6 text-neutral-700" />
            {unreadCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-black text-neutral-900">Notifications</h1>
            <p className="text-sm text-neutral-500">
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'} · {pushTokens.length} device{pushTokens.length !== 1 ? 's' : ''} registered
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => void markAllRead()} className="flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-50">
            <CheckCheck className="h-3.5 w-3.5" /> Mark all read
          </button>
          <button onClick={() => void clearRead()} className="flex items-center gap-1.5 rounded-xl border border-red-100 bg-white px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-50">
            <Trash2 className="h-3.5 w-3.5" /> Clear read
          </button>
          <button onClick={() => { void fetchNotifications(); void fetchPushTokens(); }} className="flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-50">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Notification List */}
        <div className="lg:col-span-3">
          <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-sm text-neutral-400">
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Loading…
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-neutral-300">
                <Bell className="mb-2 h-8 w-8" />
                <p className="text-sm font-medium text-neutral-400">No notifications yet</p>
              </div>
            ) : (
              <ul className="divide-y divide-neutral-50">
                {notifications.map((n) => (
                  <li key={n.id} className={cn('flex gap-3 px-4 py-3.5 transition-colors', !n.isAdminRead && 'bg-primary-50/40')}>
                    <div className={cn('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs', TYPE_STYLES[n.type] ?? TYPE_STYLES['INFO'])}>
                      {TYPE_ICONS[n.type] ?? TYPE_ICONS['INFO']}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn('text-sm font-semibold text-neutral-800 leading-snug', !n.isAdminRead && 'font-bold')}>
                          {n.title}
                        </p>
                        <span className="shrink-0 text-[10px] text-neutral-400">{timeAgo(n.createdAt)}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-neutral-500">{n.message}</p>
                      {!n.isAdminRead && (
                        <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-primary-500" />
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Broadcast Form */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-neutral-700">
              <Send className="h-4 w-4 text-primary-500" /> Send Broadcast
            </h2>
            <form onSubmit={(e) => void sendBroadcast(e)} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-neutral-600">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                >
                  <option value="PROMO">🎉 Promo / Offer</option>
                  <option value="INFO">ℹ️ Information</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-neutral-600">Title *</label>
                <input
                  type="text" value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. 5% off today!"
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-neutral-600">Message *</label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  placeholder="Use code FF5 to get 5% off on all orders above ₹299"
                  rows={3}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none resize-none"
                />
              </div>

              {/* Push Target Selection */}
              {pushTokens.length > 0 && (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-neutral-600">
                    <Smartphone className="mr-1 inline h-3.5 w-3.5" />Push to Devices
                  </label>
                  <div className="flex gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => setPushMode('all')}
                      className={cn('flex-1 rounded-lg border py-1.5 text-xs font-semibold transition-colors',
                        pushMode === 'all'
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-neutral-200 text-neutral-500 hover:bg-neutral-50'
                      )}
                    >
                      <Users className="mr-1 inline h-3 w-3" />All ({pushTokens.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setPushMode('select')}
                      className={cn('flex-1 rounded-lg border py-1.5 text-xs font-semibold transition-colors',
                        pushMode === 'select'
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-neutral-200 text-neutral-500 hover:bg-neutral-50'
                      )}
                    >
                      Select Users
                    </button>
                  </div>
                  {pushMode === 'select' && (
                    <div className="max-h-32 overflow-y-auto rounded-xl border border-neutral-200 divide-y divide-neutral-50">
                      {pushTokens.map((t) => (
                        <label key={t.token} className="flex cursor-pointer items-center gap-2 px-3 py-2 hover:bg-neutral-50">
                          <input
                            type="checkbox"
                            checked={selectedTokens.has(t.token)}
                            onChange={() => toggleToken(t.token)}
                            className="h-3.5 w-3.5 accent-primary-600"
                          />
                          <Smartphone className="h-3 w-3 shrink-0 text-neutral-400" />
                          <span className="truncate text-xs text-neutral-600">
                            {t.user_id ? `User: ${t.user_id.slice(0, 12)}…` : 'Anonymous'} · {t.platform}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {pushTokens.length === 0 && !pushLoading && (
                <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2">
                  <p className="text-xs text-amber-700">
                    <Smartphone className="mr-1 inline h-3 w-3" />
                    No devices registered yet. Install the new APK to receive push notifications.
                  </p>
                </div>
              )}

              {sendError && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">{sendError}</p>
              )}
              {sendOk && (
                <p className="rounded-lg bg-green-50 px-3 py-2 text-xs font-medium text-green-700">{sendOk}</p>
              )}
              <button
                type="submit" disabled={sending}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 py-2.5 text-sm font-bold text-white hover:bg-primary-700 disabled:opacity-60"
              >
                {sending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {sending ? 'Sending…' : 'Send Notification'}
              </button>
            </form>
          </div>

          {/* Info card */}
          <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
            <p className="text-xs font-bold text-green-700 mb-1">How it works</p>
            <ul className="space-y-1 text-xs text-green-600">
              <li>• <strong>Web:</strong> Notification bell updates for all logged-in customers instantly</li>
              <li>• <strong>APK Push:</strong> Sends sound notification to registered devices</li>
              <li>• <strong>Select Users:</strong> Target specific devices only</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
