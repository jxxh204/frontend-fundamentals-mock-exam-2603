export function generateTimeSlots(start: number, end: number): string[] {
  const slots: string[] = [];
  for (let h = start; h <= end; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`);
    if (h < end) {
      slots.push(`${String(h).padStart(2, '0')}:30`);
    }
  }
  return slots;
}

// 날짜 선택
export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function timeToMinutes(start: number, time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (h - start) * 60 + m;
}
