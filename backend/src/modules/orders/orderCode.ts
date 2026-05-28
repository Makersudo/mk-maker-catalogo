type RandomSource = () => string;

function compactDate(date: Date) {
  return date.toISOString().slice(0, 10).replace(/-/g, '');
}

export function generateOrderCode(date = new Date(), randomSource: RandomSource = () => Math.random().toString(36).slice(2, 10)) {
  const safeRandom = randomSource().toUpperCase().replace(/[^A-Z0-9]/g, '').padEnd(6, '0').slice(0, 6);
  return `MK-${compactDate(date)}-${safeRandom}`;
}
