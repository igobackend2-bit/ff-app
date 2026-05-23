'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, RefreshCw, ChevronLeft, ChevronRight, Package, Clock, ChevronDown, Download, FileText, BarChart2 } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  product: { name: string; imageUrls: string };
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  createdAt: string;
  user: { id: string; name: string | null; phone: string | null };
  address: { label?: string; line1: string; city: string; state: string; pincode: string } | null;
  items: OrderItem[];
}

const ALL_STATUSES = ['PLACED', 'CONFIRMED', 'PICKING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];

const STATUS_STYLES: Record<string, string> = {
  PLACED:           'bg-yellow-100 text-yellow-700 border-yellow-200',
  CONFIRMED:        'bg-blue-100  text-blue-700  border-blue-200',
  PICKING:          'bg-purple-100 text-purple-700 border-purple-200',
  OUT_FOR_DELIVERY: 'bg-orange-100 text-orange-700 border-orange-200',
  DELIVERED:        'bg-green-100  text-green-700  border-green-200',
  CANCELLED:        'bg-red-100    text-red-700    border-red-200',
};

const STATUS_LABELS: Record<string, string> = {
  PLACED: 'Order Placed', CONFIRMED: 'Confirmed', PICKING: 'Picking Items',
  OUT_FOR_DELIVERY: 'Out for Delivery', DELIVERED: 'Delivered', CANCELLED: 'Cancelled',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn('rounded-lg border px-2.5 py-1 text-xs font-bold', STATUS_STYLES[status] ?? 'bg-neutral-100 text-neutral-600 border-neutral-200')}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

function StatusUpdater({ orderId, currentStatus, onUpdated }: { orderId: string; currentStatus: string; onUpdated: (newStatus: string) => void }) {
  const [open, setOpen]       = useState(false);
  const [saving, setSaving]   = useState(false);

  const update = async (newStatus: string) => {
    if (newStatus === currentStatus) { setOpen(false); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        onUpdated(newStatus);
      }
    } finally {
      setSaving(false);
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={saving}
        className={cn(
          'flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold transition-colors hover:opacity-80',
          STATUS_STYLES[currentStatus] ?? 'bg-neutral-100 text-neutral-600 border-neutral-200',
        )}
      >
        {saving ? '…' : (STATUS_LABELS[currentStatus] ?? currentStatus)}
        <ChevronDown className="h-3 w-3 opacity-60" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-20 mt-1 w-48 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xl">
            {ALL_STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => void update(s)}
                className={cn(
                  'flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs font-bold transition-colors hover:bg-neutral-50',
                  s === currentStatus ? 'bg-neutral-50 opacity-60' : '',
                )}
              >
                <span className={cn('h-2 w-2 rounded-full border', STATUS_STYLES[s]?.split(' ')[0] ?? 'bg-neutral-300')} />
                {STATUS_LABELS[s] ?? s}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Export helpers ────────────────────────────────────────────────────────────
function escapeCSV(val: string | number | null | undefined): string {
  const s = String(val ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function exportCSV(orders: Order[]) {
  const headers = ['Order #','Customer','Phone','Status','Payment Method','Payment Status','Subtotal','Delivery Fee','Total','Address','Date'];
  const rows = orders.map((o) => [
    o.orderNumber,
    o.user?.name ?? '',
    o.user?.phone ?? '',
    o.status,
    o.paymentMethod,
    o.paymentStatus,
    o.subtotal?.toFixed(2),
    o.deliveryFee?.toFixed(2),
    o.total?.toFixed(2),
    o.address ? `${o.address.label ? o.address.label + ' — ' : ''}${o.address.line1}, ${o.address.city}, ${o.address.state} ${o.address.pincode}` : '',
    new Date(o.createdAt).toLocaleDateString('en-IN'),
  ]);
  const csv = [headers, ...rows].map((r) => r.map(escapeCSV).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `orders-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportExcelXML(orders: Order[]) {
  const headers = ['Order #','Customer','Phone','Status','Payment Method','Payment Status','Subtotal','Delivery Fee','Total','Address','Date'];
  const esc = (v: string | number | null | undefined) =>
    String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

  const rows = orders.map((o) => [
    o.orderNumber, o.user?.name ?? '', o.user?.phone ?? '', o.status,
    o.paymentMethod, o.paymentStatus,
    o.subtotal?.toFixed(2), o.deliveryFee?.toFixed(2), o.total?.toFixed(2),
    o.address ? `${o.address.label ? o.address.label + ' — ' : ''}${o.address.line1}, ${o.address.city}, ${o.address.state} ${o.address.pincode}` : '',
    new Date(o.createdAt).toLocaleDateString('en-IN'),
  ]);

  const xml = `<?xml version="1.0"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="Orders"><Table>
<Row>${headers.map((h) => `<Cell><Data ss:Type="String">${esc(h)}</Data></Cell>`).join('')}</Row>
${rows.map((r) => `<Row>${r.map((c) => `<Cell><Data ss:Type="String">${esc(c)}</Data></Cell>`).join('')}</Row>`).join('\n')}
</Table></Worksheet></Workbook>`;

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `orders-${new Date().toISOString().slice(0,10)}.xls`;
  a.click();
  URL.revokeObjectURL(url);
}

function printOrdersPDF(orders: Order[]) {
  const rows = orders.map((o) => `
    <tr>
      <td>${o.orderNumber}</td>
      <td>${o.user?.name ?? ''}<br/><small>${o.user?.phone ?? ''}</small></td>
      <td>${o.status}</td>
      <td>${o.paymentMethod} / ${o.paymentStatus}</td>
      <td style="text-align:right">₹${o.total?.toFixed(0)}</td>
      <td>${new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
    </tr>`).join('');

  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html><head><title>Orders Export</title>
  <style>body{font-family:sans-serif;padding:20px}h1{font-size:18px;margin-bottom:12px}
  table{width:100%;border-collapse:collapse;font-size:12px}
  th{background:#166534;color:#fff;padding:8px;text-align:left}
  td{padding:7px 8px;border-bottom:1px solid #e5e7eb}
  tr:nth-child(even){background:#f9fafb}
  @media print{@page{margin:15mm}}</style></head>
  <body><h1>Farmers Factory — Orders (${new Date().toLocaleDateString('en-IN')})</h1>
  <table><thead><tr><th>Order #</th><th>Customer</th><th>Status</th><th>Payment</th><th>Amount</th><th>Date</th></tr></thead>
  <tbody>${rows}</tbody></table></body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 400);
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AdminOrdersPage() {
  const [orders, setOrders]     = useState<Order[]>([]);
  const [total, setTotal]       = useState(0);
  const [pages, setPages]       = useState(1);
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search)       params.set('q', search);
      if (statusFilter) params.set('status', statusFilter);
      const res  = await fetch(`/api/admin/orders?${params}`);
      const data = await res.json() as { orders: Order[]; total: number; pages: number };
      setOrders(data.orders ?? []);
      setTotal(data.total  ?? 0);
      setPages(data.pages  ?? 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  const fetchAllForExport = async (): Promise<Order[]> => {
    setExporting(true);
    try {
      const params = new URLSearchParams({ page: '1', limit: '500' });
      if (search)       params.set('q', search);
      if (statusFilter) params.set('status', statusFilter);
      const res  = await fetch(`/api/admin/orders?${params}`);
      const data = await res.json() as { orders: Order[] };
      return data.orders ?? [];
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => { void fetchOrders(); }, [fetchOrders]);

  const handleStatusUpdate = (orderId: string, newStatus: string) => {
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o));
  };

  const getImageSrc = (imageUrls: string) => {
    try { return (JSON.parse(imageUrls) as string[])[0] ?? ''; }
    catch { return imageUrls ?? ''; }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-neutral-900">Orders</h1>
          <p className="mt-0.5 text-sm text-neutral-500">{total} total orders</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/orders/summary"
            className="flex items-center gap-1.5 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm font-semibold text-green-700 hover:bg-green-100"
          >
            <BarChart2 className="h-4 w-4" /> Product Summary
          </Link>
          <button
            onClick={async () => { const d = await fetchAllForExport(); exportExcelXML(d); }}
            disabled={exporting}
            className="flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-600 hover:bg-neutral-50 disabled:opacity-60"
          >
            <Download className="h-4 w-4" />
            {exporting ? 'Loading…' : 'Excel'}
          </button>
          <button
            onClick={async () => { const d = await fetchAllForExport(); printOrdersPDF(d); }}
            disabled={exporting}
            className="flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-600 hover:bg-neutral-50 disabled:opacity-60"
          >
            <FileText className="h-4 w-4" /> PDF
          </button>
          <button onClick={() => void fetchOrders()} className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-600 hover:bg-neutral-50">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-wrap gap-3">
        <form onSubmit={(e) => { e.preventDefault(); setPage(1); void fetchOrders(); }} className="flex flex-1 min-w-[220px] gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search order # or customer…"
              className="h-10 w-full rounded-xl border border-neutral-200 bg-white pl-9 pr-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
          </div>
          <button type="submit" className="h-10 rounded-xl bg-primary-600 px-4 text-sm font-bold text-white hover:bg-primary-700">Go</button>
        </form>

        <div className="flex gap-2 flex-wrap">
          {(['', ...ALL_STATUSES] as string[]).map((s) => (
            <button
              key={s || 'all'}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={cn(
                'rounded-xl border px-3 py-2 text-xs font-bold transition-colors',
                statusFilter === s
                  ? 'border-primary-600 bg-primary-600 text-white'
                  : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50',
              )}
            >
              {s ? (STATUS_LABELS[s] ?? s) : 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-sm text-neutral-400">
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Loading orders…
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-neutral-400">
            <Package className="mb-2 h-8 w-8 opacity-30" />
            <p className="text-sm font-medium">No orders found</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">
                <th className="px-5 py-3">Order</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Delivery Address</th>
                <th className="px-5 py-3">Status — click to change</th>
                <th className="px-5 py-3">Payment</th>
                <th className="px-5 py-3 text-right">Amount</th>
                <th className="px-5 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <React.Fragment key={order.id}>
                  <tr
                    className="border-b border-neutral-50 transition-colors hover:bg-neutral-50/60 last:border-0"
                  >
                    <td className="px-5 py-4">
                      <button
                        onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                        className="font-mono text-xs font-bold text-primary-700 hover:underline"
                      >
                        #{order.orderNumber}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-neutral-800">{order.user?.name || '—'}</p>
                      <p className="text-xs text-neutral-400">{order.user?.phone || ''}</p>
                    </td>
                    <td className="px-5 py-4">
                      {order.address ? (
                        <div className="text-xs text-neutral-700 leading-relaxed">
                          {/* label stores the customer name set at checkout */}
                          <p className="font-semibold text-neutral-800">
                            {order.address.label || order.user?.name || '—'}
                          </p>
                          <p className="text-neutral-600">{order.address.line1}</p>
                          <p className="text-neutral-500">{order.address.city}, {order.address.state}</p>
                          <p className="font-medium text-neutral-600">📍 {order.address.pincode}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-neutral-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {/* Inline status updater dropdown */}
                      <StatusUpdater
                        orderId={order.id}
                        currentStatus={order.status}
                        onUpdated={(s) => handleStatusUpdate(order.id, s)}
                      />
                    </td>
                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        <span className="block text-xs font-semibold text-neutral-600">{order.paymentMethod}</span>
                        <span className={cn('rounded-lg px-2 py-0.5 text-xs font-bold',
                          order.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700')}>
                          {order.paymentStatus}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right font-bold text-neutral-900">
                      ₹{order.total?.toFixed(0) ?? (order.subtotal + order.deliveryFee).toFixed(0)}
                    </td>
                    <td className="px-5 py-4 text-xs text-neutral-400">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                      </div>
                    </td>
                  </tr>

                  {/* Expanded row */}
                  {expanded === order.id && (
                    <tr className="bg-neutral-50/80">
                      <td colSpan={7} className="px-5 py-4">
                        <div className="grid gap-4 lg:grid-cols-2">
                          {/* Items */}
                          <div>
                            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-400">Order Items</p>
                            <div className="flex flex-wrap gap-2">
                              {order.items.map((item) => (
                                <div key={item.id} className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white p-2.5 shadow-sm">
                                  {getImageSrc(item.product.imageUrls) && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={getImageSrc(item.product.imageUrls)}
                                      alt={item.product.name}
                                      className="h-10 w-10 rounded-lg object-cover"
                                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                    />
                                  )}
                                  <div>
                                    <p className="text-xs font-semibold text-neutral-800">{item.product.name}</p>
                                    <p className="text-[11px] text-neutral-500">Qty: {item.quantity} · ₹{item.unitPrice}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Delivery address */}
                          {order.address && (
                            <div>
                              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-400">Delivery Address</p>
                              <div className="rounded-xl border border-neutral-200 bg-white p-3 text-xs text-neutral-700 shadow-sm">
                                <p className="font-bold">{order.address.label || order.user?.name || '—'}</p>
                                <p className="mt-0.5 text-neutral-500">{order.address.line1}</p>
                                <p className="text-neutral-500">{order.address.city}, {order.address.state} – {order.address.pincode}</p>
                                {order.user?.phone && <p className="mt-1 font-semibold text-neutral-700">📞 {order.user.phone}</p>}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <p className="text-neutral-500">Page {page} of {pages}</p>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 bg-white disabled:opacity-40 hover:bg-neutral-50">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 bg-white disabled:opacity-40 hover:bg-neutral-50">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
