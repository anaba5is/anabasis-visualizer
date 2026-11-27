const books = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

export function bookFor(stop) {
  return books[Number.parseInt(stop.book, 10) - 1];
}

export function placeAndBook(stop) {
  return `${stop.region} · Book ${bookFor(stop)}`;
}

export function formatStopDate(stop, { spoken = false } = {}) {
  if (stop.date.startsWith('Winter ')) return stop.date;
  return `${spoken ? 'circa' : 'c.'} ${stop.date}`;
}
