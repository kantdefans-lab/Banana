const DAY_MS = 24 * 60 * 60 * 1000;

export type DayBucket = {
  date: string;
  value: number;
};

function toDayKeyUtc(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function buildDayBuckets<T>({
  start,
  days,
  items,
  getDate,
  getValue,
}: {
  start: Date;
  days: number;
  items: T[];
  getDate: (item: T) => Date | null | undefined;
  getValue: (item: T) => number;
}): DayBucket[] {
  const startUtc = Date.UTC(
    start.getUTCFullYear(),
    start.getUTCMonth(),
    start.getUTCDate()
  );

  const buckets = new Map<string, number>();
  for (let i = 0; i < days; i += 1) {
    const day = new Date(startUtc + i * DAY_MS);
    buckets.set(toDayKeyUtc(day), 0);
  }

  for (const item of items) {
    const dt = getDate(item);
    if (!dt) continue;
    const key = toDayKeyUtc(dt);
    if (!buckets.has(key)) continue;
    const current = buckets.get(key) || 0;
    buckets.set(key, current + getValue(item));
  }

  return Array.from(buckets.entries()).map(([date, value]) => ({
    date,
    value,
  }));
}
