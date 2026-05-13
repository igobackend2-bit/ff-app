import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Tailwind class merging utility
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Currency formatter (INR)
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Discount percentage
export function discountPercent(mrp: number, price: number): number {
  if (mrp <= price) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
}

// Truncate text
export function truncate(str: string, maxLength: number): string {
  return str.length <= maxLength ? str : str.slice(0, maxLength - 3) + '...';
}

// Order number generator: QC-20240101-XXXX
export function generateOrderNumber(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `QC-${dateStr}-${random}`;
}

// Slug generator
export function toSlug(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// Delivery ETA display
export function formatEta(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// Relative time
export function timeAgo(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const seconds = Math.floor(diff / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}
// Calculate effective price based on unit and weight
export function calculateEffectivePrice(basePrice: number, unit: string, weight: number = 1): number {
  const unitStr = unit.toLowerCase();
  let perKgMultiplier = 1;
  if (unitStr.includes('250g')) perKgMultiplier = 4;
  else if (unitStr.includes('500g')) perKgMultiplier = 2;

  return basePrice * perKgMultiplier * weight;
}
