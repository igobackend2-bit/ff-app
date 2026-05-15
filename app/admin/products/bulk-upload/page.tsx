'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Upload, CheckCircle, XCircle, RefreshCw, Download, FileSpreadsheet } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductRow {
  name: string; description?: string; price: string | number; mrp?: string | number;
  unit: string; category: string; tags?: string; imageUrl?: string;
  inStock?: string | boolean; isFeatured?: string | boolean;
}
interface Result { name: string; status: 'created' | 'skipped' | 'error'; reason?: string }

// ── Parse CSV ──────────────────────────────────────────────────────────────
function parseCSV(text: string): ProductRow[] {
  const lines  = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter((l) => l.trim());
  if (lines.length < 2) return [];

  // Handle quoted CSV fields
  function splitLine(line: string): string[] {
    const result: string[] = [];
    let cur = ''; let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        result.push(cur.trim()); cur = '';
      } else { cur += ch; }
    }
    result.push(cur.trim());
    return result;
  }

  const headers = splitLine(lines[0] ?? '').map((h) => h.toLowerCase().replace(/\s+/g, ''));
  const col = (row: string[], name: string) => {
    const idx = headers.indexOf(name);
    return idx >= 0 ? row[idx] ?? '' : '';
  };

  return lines.slice(1).map((line) => {
    const row = splitLine(line);
    return {
      name:        col(row, 'name'),
      description: col(row, 'description'),
      price:       col(row, 'price'),
      mrp:         col(row, 'mrp'),
      unit:        col(row, 'unit'),
      category:    col(row, 'category'),
      tags:        col(row, 'tags'),
      imageUrl:    col(row, 'imageurl') || col(row, 'image_url') || col(row, 'image'),
      inStock:     col(row, 'instock') || col(row, 'in_stock'),
      isFeatured:  col(row, 'isfeatured') || col(row, 'is_featured'),
    };
  }).filter((r) => r.name.trim());
}

// ── Download template ──────────────────────────────────────────────────────
function downloadTemplate() {
  const headers = 'name,description,price,mrp,unit,category,tags,imageUrl,inStock,isFeatured';
  const example = [
    'Organic Turmeric Powder,"Fresh ground turmeric",120,150,200 gm,spices,"organic,spice",/images/spice/turmeric.jpg,TRUE,FALSE',
    'Raw Cashews,"Premium quality cashews",280,320,250 gm,nuts,"nuts,premium",,TRUE,TRUE',
    'Foxtail Millet,"Nutritious ancient grain",90,110,500 gm,millets,"millet,grain",,TRUE,FALSE',
  ].join('\n');
  const csv  = headers + '\n' + example;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'bulk-upload-template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// ── Page component ─────────────────────────────────────────────────────────
export default function BulkUploadPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [parsed,   setParsed]   = useState<ProductRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [parseErr, setParseErr] = useState('');
  const [uploading, setUploading] = useState(false);
  const [results,  setResults]  = useState<Result[] | null>(null);
  const [summary,  setSummary]  = useState<{ created: number; errors: number; total: number } | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setResults(null); setSummary(null); setParseErr(''); setParsed([]);
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        const rows = parseCSV(text);
        if (rows.length === 0) throw new Error('No data rows found. Check your CSV format.');
        setParsed(rows);
      } catch (err) {
        setParseErr(err instanceof Error ? err.message : 'Failed to parse file');
      }
    };
    reader.readAsText(file);
  };

  const handleUpload = async () => {
    if (parsed.length === 0) return;
    setUploading(true);
    setResults(null);
    try {
      const res  = await fetch('/api/admin/products/bulk-upload', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ products: parsed }),
      });
      const data = await res.json() as {
        ok?: boolean; created?: number; errors?: number; total?: number;
        results?: Result[]; error?: string;
      };
      if (!res.ok || data.error) throw new Error(data.error ?? 'Upload failed');
      setSummary({ created: data.created ?? 0, errors: data.errors ?? 0, total: data.total ?? 0 });
      setResults(data.results ?? []);
    } catch (err) {
      setParseErr(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setParsed([]); setFileName(''); setParseErr(''); setResults(null); setSummary(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/products" className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-neutral-900">Bulk Product Upload</h1>
          <p className="text-sm text-neutral-500">Upload a CSV file to create multiple products at once</p>
        </div>
      </div>

      {/* Instructions */}
      <div className="mb-5 rounded-2xl border border-blue-100 bg-blue-50 p-5">
        <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-blue-800">
          <FileSpreadsheet className="h-4 w-4" /> CSV Format Instructions
        </h2>
        <p className="mb-2 text-xs text-blue-700">
          Your CSV must have these column headers (exact names, case-insensitive):
        </p>
        <div className="flex flex-wrap gap-1.5">
          {['name*', 'price*', 'unit*', 'category*', 'description', 'mrp', 'tags', 'imageUrl', 'inStock', 'isFeatured'].map((h) => (
            <span key={h} className={cn('rounded-lg px-2 py-0.5 text-xs font-bold',
              h.includes('*') ? 'bg-blue-200 text-blue-800' : 'bg-blue-100 text-blue-600')}>
              {h}
            </span>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-blue-600">* Required fields. <strong>category</strong> must match an existing category slug or name (e.g., "spices", "fruits", "millets").</p>
        <button
          onClick={downloadTemplate}
          className="mt-3 flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700"
        >
          <Download className="h-3.5 w-3.5" /> Download Template CSV
        </button>
      </div>

      {/* Upload area */}
      <div className="mb-5 rounded-2xl border-2 border-dashed border-neutral-200 bg-white p-8 text-center">
        <Upload className="mx-auto mb-3 h-8 w-8 text-neutral-300" />
        <p className="mb-1 font-semibold text-neutral-700">
          {fileName ? `📄 ${fileName}` : 'Click to choose a CSV file'}
        </p>
        <p className="mb-4 text-xs text-neutral-400">Supports .csv files up to 500 products</p>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="rounded-xl border border-neutral-200 bg-neutral-50 px-5 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-100"
        >
          Choose File
        </button>
        <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
      </div>

      {parseErr && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          ❌ {parseErr}
        </div>
      )}

      {/* Preview */}
      {parsed.length > 0 && !results && (
        <div className="mb-5 rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
            <p className="font-bold text-neutral-800">{parsed.length} products ready to upload</p>
            <div className="flex gap-2">
              <button onClick={reset} className="rounded-xl border border-neutral-200 px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-50">
                Clear
              </button>
              <button
                onClick={() => void handleUpload()}
                disabled={uploading}
                className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-xs font-bold text-white hover:bg-primary-700 disabled:opacity-60"
              >
                {uploading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                {uploading ? `Creating products…` : `Upload ${parsed.length} Products`}
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50 text-left text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                  <th className="px-4 py-2">#</th>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Price</th>
                  <th className="px-4 py-2">Unit</th>
                  <th className="px-4 py-2">Category</th>
                  <th className="px-4 py-2">Tags</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {parsed.slice(0, 20).map((row, i) => (
                  <tr key={i} className="hover:bg-neutral-50/60">
                    <td className="px-4 py-2 text-neutral-400">{i + 1}</td>
                    <td className="px-4 py-2 font-semibold text-neutral-800">{row.name}</td>
                    <td className="px-4 py-2 text-neutral-700">₹{row.price}</td>
                    <td className="px-4 py-2 text-neutral-500">{row.unit}</td>
                    <td className="px-4 py-2">
                      <span className="rounded-lg bg-primary-50 px-2 py-0.5 text-[10px] font-bold text-primary-700">{row.category}</span>
                    </td>
                    <td className="px-4 py-2 text-neutral-400">{row.tags ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {parsed.length > 20 && (
              <p className="px-4 py-3 text-xs text-neutral-400">…and {parsed.length - 20} more rows</p>
            )}
          </div>
        </div>
      )}

      {/* Results */}
      {results && summary && (
        <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <div className="border-b border-neutral-100 px-5 py-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-neutral-800">Upload Complete</h2>
              <button onClick={reset} className="rounded-xl border border-neutral-200 px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-50">
                Upload another
              </button>
            </div>
            <div className="mt-3 flex gap-4">
              <div className="flex items-center gap-2 rounded-xl bg-green-50 px-3 py-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-bold text-green-700">{summary.created} created</span>
              </div>
              {summary.errors > 0 && (
                <div className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-bold text-red-600">{summary.errors} failed</span>
                </div>
              )}
              <div className="flex items-center gap-2 rounded-xl bg-neutral-50 px-3 py-2">
                <span className="text-sm font-semibold text-neutral-600">{summary.total} total</span>
              </div>
            </div>
          </div>
          <div className="max-h-80 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-neutral-50">
                <tr className="border-b border-neutral-100 text-left text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                  <th className="px-4 py-2">Product</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {results.map((r, i) => (
                  <tr key={i} className={cn('hover:bg-neutral-50/60', r.status === 'error' && 'bg-red-50/30')}>
                    <td className="px-4 py-2 font-semibold text-neutral-800">{r.name}</td>
                    <td className="px-4 py-2">
                      {r.status === 'created' ? (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
                          <CheckCircle className="h-2.5 w-2.5" /> Created
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">
                          <XCircle className="h-2.5 w-2.5" /> Failed
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-neutral-400">{r.reason ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {summary.created > 0 && (
            <div className="border-t border-neutral-100 px-5 py-3">
              <Link href="/admin/products" className="text-xs font-semibold text-primary-600 hover:underline">
                → View all products
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
