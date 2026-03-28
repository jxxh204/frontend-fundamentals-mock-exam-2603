import { css } from '@emotion/react';
import { useSuspenseQueries } from '@tanstack/react-query';
import { ListRow, Spacing, Text } from '_tosslib/components';
import { colors } from '_tosslib/constants/colors';
import { getRooms, getReservations } from 'pages/remotes';
import { EQUIPMENT_LABELS } from 'pages/constants';
import { 수용가능, 장비충족, 선호층일치, 시간충돌없음, 층별이름순 } from 'pages/utils';
import { EmptyRoom } from 'pages/ui/EmptyReservation';
import { queries } from 'queries';

type RoomFilter = {
  date: string;
  startTime: string;
  endTime: string;
  attendees: number;
  equipment: string[];
  preferredFloor: number | null;
};

type AvailableRoomListProps = {
  title: string;
  filter: RoomFilter;
  selectedRoomId: string | null;
  onSelect: (roomId: string) => void;
};

export function AvailableRoomList({ title, filter, selectedRoomId, onSelect }: AvailableRoomListProps) {
  const { date, startTime, endTime, attendees, equipment, preferredFloor } = filter;

  const [{ data: rooms }, { data: reservations }] = useSuspenseQueries({
    queries: [{ queryKey: ['rooms'], queryFn: getRooms }, queries.reservations(date)],
  });

  const availableRooms = rooms
    .filter(
      (room: { id: string; capacity: number; equipment: string[]; floor: number; name: string }) =>
        수용가능(room, attendees) &&
        장비충족(room, equipment) &&
        선호층일치(room, preferredFloor) &&
        시간충돌없음(room, reservations, { date, startTime, endTime })
    )
    .sort(층별이름순);

  return (
    <>
      <div
        css={css`
          display: flex;
          align-items: baseline;
          gap: 6px;
        `}
      >
        <Text typography="t5" fontWeight="bold" color={colors.grey900}>
          {title}
        </Text>
        <Text typography="t7" fontWeight="medium" color={colors.grey500}>
          {availableRooms.length}개
        </Text>
      </div>
      <Spacing size={16} />

      {availableRooms.length === 0 ? (
        <EmptyRoom title="조건에 맞는 회의실이 없습니다." />
      ) : (
        <div
          css={css`
            display: flex;
            flex-direction: column;
            gap: 10px;
          `}
        >
          {availableRooms.map(
            (room: { id: string; name: string; floor: number; capacity: number; equipment: string[] }) => {
              const isSelected = selectedRoomId === room.id;
              return (
                <ReservationRoom
                  key={room.id}
                  roomName={room.name}
                  description={`${room.floor}층 · ${room.capacity}명 · ${room.equipment
                    .map((e: string) => EQUIPMENT_LABELS[e])
                    .join(', ')}`}
                  selected={isSelected}
                  onClick={() => onSelect(room.id)}
                >
                  {isSelected && (
                    <Text typography="t7" fontWeight="bold" color={colors.blue500}>
                      선택됨
                    </Text>
                  )}
                </ReservationRoom>
              );
            }
          )}
        </div>
      )}
    </>
  );
}

type ReservationRoomProps = {
  roomName: string;
  description: string;
  selected?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
};

export function ReservationRoom({ roomName, description, selected, onClick, children }: ReservationRoomProps) {
  return (
    <div
      role={onClick ? 'button' : undefined}
      aria-pressed={selected}
      aria-label={roomName}
      onClick={onClick}
      css={css`
        padding: 14px 16px;
        border-radius: 14px;
        background: ${selected ? colors.blue50 : colors.grey50};
        border: ${selected ? `2px solid ${colors.blue500}` : `1px solid ${colors.grey200}`};
        ${onClick
          ? `
          cursor: pointer;
          transition: all 0.15s;
          &:hover {
            border-color: ${selected ? colors.blue500 : colors.grey300};
          }
        `
          : ''}
      `}
    >
      <ListRow
        contents={
          <ListRow.Text2Rows
            top={roomName}
            topProps={{ typography: 't6', fontWeight: 'bold', color: colors.grey900 }}
            bottom={description}
            bottomProps={{ typography: 't7', color: colors.grey600 }}
          />
        }
        right={children}
      />
    </div>
  );
}
