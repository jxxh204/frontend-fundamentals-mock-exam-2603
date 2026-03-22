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

type Room = { id: string; capacity: number; equipment: string[]; floor: number; name: string };
type Reservation = { roomId: string; date: string; start: string; end: string };

export const 수용가능 = (room: Room, attendees: number) => room.capacity >= attendees;

export const 장비충족 = (room: Room, required: string[]) =>
  required.every(eq => room.equipment.includes(eq));

export const 선호층일치 = (room: Room, floor: number | null) =>
  floor === null || room.floor === floor;

export const 시간충돌없음 = (
  room: Room,
  reservations: Reservation[],
  filter: { date: string; startTime: string; endTime: string }
) =>
  !reservations.some(
    r => r.roomId === room.id && r.date === filter.date && r.start < filter.endTime && r.end > filter.startTime
  );

export const 층별이름순 = (a: Room, b: Room) =>
  a.floor !== b.floor ? a.floor - b.floor : a.name.localeCompare(b.name);
