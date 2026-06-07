export function formatPrice(value) {
  if (value == null) return 'Contact Us';
  return `$${Number(value).toFixed(2)}`;
}

// Build a wa.me deep link with an optional prefilled message.
export function whatsappLink(number, message = '') {
  const clean = String(number || '').replace(/[^\d]/g, '');
  const text = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${clean}${text}`;
}

export function telLink(phone) {
  return `tel:${String(phone || '').replace(/[^\d+]/g, '')}`;
}

export function mapsLink(query) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query || '')}`;
}
