const rupees = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

export function formatPrice(n) {
  return `₹${rupees.format(Number(n) || 0)}`;
}

/** Link that opens WhatsApp with a ready-made booking message for one car. */
export function bookingLink(number, car) {
  const link = `${window.location.origin}/car/${car._id}`;
  const text =
    `Hi, I'd like to book this diecast car:\n` +
    `${car.name} (${car.brand}, ${car.scale}, ${car.condition})\n` +
    `Price: ${formatPrice(car.price)}\n${link}`;
  return `https://wa.me/${String(number).replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
}

export function generalLink(number) {
  return `https://wa.me/${String(number).replace(/\D/g, '')}?text=${encodeURIComponent('Hi, I saw your diecast collection and have a question.')}`;
}

export const SCALES = ['1:64', '1:43', '1:32', '1:24', '1:18', '1:12'];
export const CONDITIONS = ['Sealed', 'Boxed', 'Loose'];
export const STATUS_LABEL = { available: 'Available', reserved: 'Reserved', sold: 'Sold' };
