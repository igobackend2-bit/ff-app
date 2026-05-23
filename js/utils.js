// ============================================================
// utils.js — Shared utility functions
// ============================================================

/** Show a toast notification */
export function showToast(message, type = 'success', duration = 2700) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), duration);
}

/** Show/hide a modal overlay */
export function openModal(overlay) {
  overlay.classList.add('show');
  document.body.style.overflow = 'hidden';
}
export function closeModal(overlay) {
  overlay.classList.remove('show');
  document.body.style.overflow = '';
}

/** Format date as "12 May 2025" */
export function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Format price as ₹XX */
export function formatPrice(amount) {
  return '₹' + Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 0 });
}

/** Validate email format */
export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/** Validate 10-digit Indian phone */
export function isValidPhone(phone) {
  return /^[6-9]\d{9}$/.test(phone.trim());
}

/** Get current location via GPS + Nominatim reverse geocode */
export async function detectLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported by your browser.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        try {
          const r = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
            { headers: { 'Accept-Language': 'en', 'User-Agent': 'FarmersFactory/1.0' } }
          );
          const d = await r.json();
          const area = d.address?.suburb || d.address?.neighbourhood || d.address?.town || d.address?.city || '';
          const city = d.address?.city || d.address?.town || d.address?.county || 'Chennai';
          const pincode = d.address?.postcode || '';
          resolve({
            lat, lng,
            address: area ? `${area}, ${city}` : d.display_name,
            area, city, pincode,
          });
        } catch {
          resolve({ lat, lng, address: `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`, area: '', city: 'Chennai', pincode: '' });
        }
      },
      (err) => {
        const msgs = {
          1: 'Location permission denied. Please allow location access.',
          2: 'Location unavailable. Please try again.',
          3: 'Location request timed out. Please try again.',
        };
        reject(new Error(msgs[err.code] || 'Could not detect location.'));
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 5 * 60 * 1000 }
    );
  });
}

/** Get/set delivery location in localStorage */
export function getLocation() {
  try { return JSON.parse(localStorage.getItem('ff_location')); }
  catch { return null; }
}
export function setLocation(loc) {
  localStorage.setItem('ff_location', JSON.stringify(loc));
  window.dispatchEvent(new CustomEvent('location-updated', { detail: loc }));
}

/** Discount percentage */
export function discountPct(price, oldPrice) {
  if (!oldPrice || oldPrice <= price) return 0;
  return Math.round((1 - price / oldPrice) * 100);
}
