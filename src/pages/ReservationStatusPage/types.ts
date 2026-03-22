export type Equipment = 'tv' | 'whiteboard' | 'video' | 'speaker';

export type Room = {
  id: string;
  name: string;
  floor: number;
  capacity: number;
  equipment: Equipment[];
};

export type Reservation = {
  id: string;
  roomId: string;
  date: string;
  start: string;
  end: string;
  attendees: number;
  equipment: Equipment[];
};

export type MyReservation = Reservation;

export type DatePickerType = {
  minDate: string;
  selectedDate: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export type TimeLineHeaderType = {
  start: number;
  end: number;
};

export type TimeLineTrackType = {
  children: React.ReactNode;
};
