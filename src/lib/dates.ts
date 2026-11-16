export function dateKey(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseDate(value: string): Date {
  return new Date(`${value}T12:00:00`);
}

export function isDateKey(value: string): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(parseDate(value).getTime()) &&
    dateKey(parseDate(value)) === value
  );
}

export function addDays(value: string, days: number): string {
  const date = parseDate(value);
  date.setDate(date.getDate() + days);
  return dateKey(date);
}

export function formatDate(
  value: string,
  options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' },
): string {
  return parseDate(value).toLocaleDateString('pt-BR', options);
}

export function startTime(data: string, hora: string): number {
  return new Date(`${data}T${hora}:00`).getTime();
}

export function isOpenDay(value: string): boolean {
  return isDateKey(value) && parseDate(value).getDay() !== 0;
}

export function nextOpenDay(value: string): string {
  return isOpenDay(value) ? value : addDays(value, 1);
}

export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .filter((_, index, names) => index === 0 || index === names.length - 1)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}
