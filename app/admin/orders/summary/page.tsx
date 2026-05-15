'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Download, FileText, Package, ArrowLeft, TrendingUp, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

interface ProductSummary {
  productId:    string;
  name:         string;
  unit:         string;
  imageUrls:    string;
  totalQty:     number;
  totalRevenue: number;
  orderCount:   number;
}

const STATUS_OPTIONS = ['', 'PLACED', 'CONFIRMED', 'PICKING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];

// ── Export helpers ──────────────────────────────────────────────────────────
function exportCSV(rows: ProductSummary[], label: string) {
  const headers = 'Product,Unit,Total Qty Ordered,Total Orders,Revenue (INR)';
  const lines = rows.map((r) =>
    [r.name, r.unit, r.totalQty, r.orderCount, r.totalRevenue.toFixed(2)]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(','),
  );
  const csv  = headers + '\n' + lines.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `product-summary-${label}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportExcel(rows: ProductSummary[], label: string) {
  const esc = (v: string | number) =>
    String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const headers = ['Product', 'Unit', 'Total Qty Ordered', 'Total Orders', 'Revenue (₹)'];
  const dataRows = rows.map((r) => [r.name, r.unit, r.totalQty, r.orderCount, r.totalRevenue.toFixed(2)]);
  const xml = `<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="Product Summary"><Table>
<Row>${headers.map((h) => `<Cell><Data ss:Type="String">${esc(h)}</Data></Cell>`).join('')}</Row>
${dataRows.map((r) => `<Row>${r.map((c) => `<Cell><Data ss:Type="String">${esc(c)}</Data></Cell>`).join('')}</Row>`).join('\n')}
</Table></Worksheet></Workbook>`;
  const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `product-summary-${label}.xls`;
  a.click();
  URL.revokeObjectURL(url);
}

function printPDF(rows: ProductSummary[], label: string, filters: string) {
  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const tableRows = rows.map((r, i) => `
    <tr style="background:${i % 2 === 0 ? '#f9fafb' : '#fff'}">
      <td>${i + 1}</td>
      <td style="font-weight:600">${esc(r.name)}</td>
      <td style="text-align:center">${r.unit}</td>
      <td style="text-align:center;font-weight:700;font-size:15px;color:#166534">${r.totalQty}</td>
      <td style="text-align:center">${r.orderCount}</td>
      <td style="text-align:right;font-weight:700">₹${r.totalRevenue.toFixed(0)}</td>
    </tr>`).join('');
  const totalQty = rows.reduce((s, r) => s + r.totalQty, 0);
  const totalRev = rows.reduce((s, r) => s + r.totalRevenue, 0);

  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html><head><title>Product Summary</title>
  <style>
    body{font-family:sans-serif;padding:24px;color:#111}
    h1{font-size:20px;font-weight:900;margin-bottom:4px}
    .sub{font-size:12px;color:#6b7280;margin-bottom:16px}
    table{width:100%;border-collapse:collapse;font-size:13px}
    th{background:#166534;color:#fff;padding:9px 10px;text-align:left}
    td{padding:8px 10px;border-bottom:1px solid #e5e7eb}
    tfoot td{background:#f0fdf4;font-weight:700;border-top:2px solid #166534}
    @media print{@page{margin:15mm}}
  </style></head>
  <body>
  <h1>🧺 Farmers Factory — Product Order Summary</h1>
  <div class="sub">Generated: ${new Date().toLocaleString('en-IN')} &nbsp;|&nbsp; ${filters || 'All orders'}</div>
  <table>
    <thead>
      <tr>
        <th>#</th><th>Product</th><th style="text-align:center">Unit</th>
        <th style="text-align:center">Total Qty Ordered</th>
        <th style="text-align:center">No. of Orders</th>
        <th style="text-align:right">Revenue</th>
      </tr>
    </thead>
    <tbody>${tableRows}</tbody>
    <tfoot>
      <tr>
        <td colspan="3">TOTAL</td>
        <td style="text-align:center">${totalQty}</td>
        <td></td>
        <td style="text-align:right">₹${totalRev.toFixed(0)}</td>
      </tr>
    </tfoot>
  </table>
  </body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 400);
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function OrderSummaryPage() {
  const [summary,    setSummary]    = useState<ProductSummary[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [exporting,  setExporting]  = useState(false);
  const [status,     setStatus]     = useState('DELIVERED');
  const [from,       setFrom]       = useState('');
  const [to,         setTo]         = useState('');

  const today = new Date().toISOString().slice(0, 10);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (from)   params.set('from', from);
      if (to)     params.set('to', to);
      const res  = await fetch(`/api/admin/orders/product-summary?${params}`);
      const data = await res.json() as { summary: ProductSummary[] };
      setSummary(data.summary ?? []);
    } finally {
      setLoading(false);
    }
  }, [status, from, to]);

  useEffect(() => { void fetchSummary(); }, [fetchSummary]);

  const totalQty  = summary.reduce((s, r) => s + r.totalQty,     0);
  const totalRev  = summary.reduce((s, r) => s + r.totalRevenue, 0);
  const totalOrds = summary.reduce((s, r) => s + r.orderCount,   0);

  const filterLabel = [
    status || 'All statuses',
    from ? `from ${from}` : '',
    to   ? `to ${to}`     : '',
  ].filter(Boolean).join(', ');

  const getImage = (urls: string) => {
    try { return (JSON.parse(urls) as string[])[0] ?? ''; }
    catch { return urls ?? ''; }
  };

  const doExport = (type: 'csv' | 'excel' | 'pdf') => {
    const label = today;
    if (type === 'csv')   exportCSV(summary, label);
    if (type === 'excel') exportExcel(summary, label);
    if (type === 'pdf')   printPDF(summary, label, filterLabel);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/orders" className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-neutral-900">Product Order Summary</h1>
            <p className="text-sm text-neutral-500">Total qty ordered per product • {summary.length} products</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setExporting(true); doExport('excel'); setExporting(false); }}
            className="flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-600 hover:bg-neutral-50"
          >
            <Download className="h-4 w-4" /> Excel
          </button>
          <button
            onClick={() => doExport('pdf')}
            className="flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-600 hover:bg-neutral-50"
          >
            <FileText className="h-4 w-4" /> PDF
          </button>
          <button onClick={() => void fetchSummary()} className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-600 hover:bg-neutral-50">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-wrap items-end gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div>
          <label className="mb-1 block text-xs font-semibold text-neutral-500">Order Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-10 rounded-xl border border-neutral-200 bg-white px-3 text-sm focus:border-primary-500 focus:outline-none"
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.filter(Boolean).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-neutral-500">From Date</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
            className="h-10 rounded-xl border border-neutral-200 bg-white px-3 text-sm focus:border-primary-500 focus:outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-neutral-500">To Date</label>
          <input type="date" value={to} max={today} onChange={(e) => setTo(e.target.value)}
            className="h-10 rounded-xl border border-neutral-200 bg-white px-3 text-sm focus:border-primary-500 focus:outline-none" />
        </div>
        <button
          onClick={() => { setStatus('DELIVERED'); setFrom(''); setTo(''); }}
          className="h-10 rounded-xl border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-500 hover:bg-neutral-50"
        >
          Reset
        </button>
      </div>

      {/* Summary tiles */}
      <div className="mb-5 grid grid-cols-3 gap-4">
        {[
          { label: 'Products Ordered', value: summary.length, icon: Package,     color: 'bg-blue-500' },
          { label: 'Total Qty',        value: totalQty,       icon: ShoppingBag, color: 'bg-green-500' },
          { label: 'Total Revenue',    value: `₹${totalRev.toFixed(0)}`, icon: TrendingUp, color: 'bg-primary-600' },
        ].map((c) => (
          <div key={c.label} className="flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${c.color}`}>
              <c.icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-neutral-500">{c.label}</p>
              <p className="text-2xl font-black text-neutral-900">{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-sm text-neutral-400">
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Loading summary…
          </div>
        ) : summary.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-neutral-300">
            <Package className="mb-2 h-8 w-8" />
            <p className="text-sm font-medium text-neutral-400">No order data found for this filter</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">
                <th className="px-5 py-3">#</th>
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3 text-center">Unit</th>
                <th className="px-5 py-3 text-center">Total Qty Ordered</th>
                <th className="px-5 py-3 text-center">No. of Orders</th>
                <th className="px-5 py-3 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {summary.map((row, idx) => {
                const img = getImage(row.imageUrls);
                return (
                  <tr key={row.productId} className="border-b border-neutral-50 transition-colors hover:bg-neutral-50/60 last:border-0">
                    <td className="px-5 py-3 text-xs font-semibold text-neutral-400">{idx + 1}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {img ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={img} alt={row.name}
                            className="h-10 w-10 rounded-xl object-cover border border-neutral-100"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        ) : (
                          <div className="h-10 w-10 rounded-xl bg-neutral-100 flex items-center justify-center">
                            <Package className="h-4 w-4 text-neutral-300" />
                          </div>
                        )}
                        <p className="font-semibold text-neutral-900">{row.name}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-center text-xs text-neutral-500">{row.unit}</td>
                    <td className="px-5 py-3 text-center">
                      <span className="inline-flex items-center justify-center rounded-xl bg-green-100 px-3 py-1 text-base font-black text-green-700">
                        {row.totalQty}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center text-sm font-semibold text-neutral-600">{row.orderCount}</td>
                    <td className="px-5 py-3 text-right font-bold text-neutral-900">₹{row.totalRevenue.toFixed(0)}</td>
                  </tr>
                );
              })}
            </tbody>
            {/* Footer totals */}
            <tfoot>
              <tr className="border-t-2 border-green-200 bg-green-50/60">
                <td className="px-5 py-3 text-xs font-bold text-neutral-500" colSpan={3}>TOTAL</td>
                <td className="px-5 py-3 text-center">
                  <span className="inline-flex items-center justify-center rounded-xl bg-green-600 px-3 py-1 text-base font-black text-white">
                    {totalQty}
                  </span>
                </td>
                <td className="px-5 py-3 text-center text-sm font-bold text-neutral-700">{totalOrds}</td>
                <td className="px-5 py-3 text-right text-base font-black text-neutral-900">₹{totalRev.toFixed(0)}</td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
}
