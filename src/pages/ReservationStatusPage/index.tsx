import { css } from '@emotion/react';
import { Suspense, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Top, Spacing, Border, Button, Text, ListRow } from '_tosslib/components';
import { colors } from '_tosslib/constants/colors';
import { getRooms, getMyReservations, cancelReservation } from 'pages/remotes';
import { formatDate } from './utils';
import { Banner } from './ui/Banner';
import { Section } from './ui/Section';
import { ReservationTimeline } from './ReservationTimeline';

type Room = {
  id: string;
  name: string;
};

type MyReservation = {
  id: string;
  roomId: string;
  date: string;
  start: string;
  end: string;
  attendees: number;
  equipment: string[];
};

const EQUIPMENT_LABELS: Record<string, string> = {
  tv: 'TV',
  whiteboard: '화이트보드',
  video: '화상장비',
  speaker: '스피커',
};

export function ReservationStatusPage() {
  const navigate = useNavigate(); // 예약하기 버튼
  const queryClient = useQueryClient();

  const [date, setDate] = useState(formatDate(new Date()));

  // 내 예약
  const { data: rooms = [] } = useQuery({ queryKey: ['rooms'], queryFn: getRooms });

  // 메세지 배너
  const location = useLocation();
  const locationState = location.state as { message?: string } | null;
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    locationState?.message ? { type: 'success', text: locationState.message } : null
  );
  // 내 예약
  const { data: myReservationList = [] } = useQuery({
    queryKey: ['myReservations'],
    queryFn: () => getMyReservations(),
  });

  useEffect(() => {
    if (locationState?.message) {
      window.history.replaceState({}, '');
    }
  }, [locationState]);

  return (
    <div
      css={css`
        background: ${colors.white};
        padding-bottom: 40px;
      `}
    >
      <Top.Top03
        css={css`
          padding-left: 24px;
          padding-right: 24px;
        `}
      >
        회의실 예약
      </Top.Top03>

      <Spacing size={24} />

      <Section>
        <Text typography="t5" fontWeight="bold" color={colors.grey900}>
          날짜 선택
        </Text>
        <Spacing size={16} />
        <DatePicker selectedDate={date} minDate={formatDate(new Date())} onChange={e => setDate(e.target.value)} />
      </Section>

      <Spacing size={24} />
      <Border size={8} />
      <Spacing size={24} />

      <Section>
        <Text typography="t5" fontWeight="bold" color={colors.grey900}>
          예약 현황
        </Text>
        <Spacing size={16} />
        <Suspense fallback={<div>로딩 중...</div>}>
          <ReservationTimeline date={date} />
        </Suspense>
      </Section>

      <Spacing size={24} />
      <Border size={8} />
      <Spacing size={24} />

      {/* 메시지 배너 */}
      {message && (
        <Section>
          <Banner type={message.type} text={message.text} />
          <Spacing size={12} />
        </Section>
      )}

      {/* 내 예약 목록 */}
      <Section>
        <div
          css={css`
            display: flex;
            align-items: baseline;
            gap: 6px;
          `}
        >
          <Text typography="t5" fontWeight="bold" color={colors.grey900}>
            내 예약
          </Text>
          {myReservationList.length > 0 && (
            <Text typography="t7" fontWeight="medium" color={colors.grey500}>
              {myReservationList.length}건
            </Text>
          )}
        </div>
        <Spacing size={16} />

        {myReservationList.length === 0 ? (
          <EmptyReservation title="예약 내역이 없습니다." />
        ) : (
          <div
            css={css`
              display: flex;
              flex-direction: column;
              gap: 10px;
            `}
          >
            {myReservationList.map((reservation: MyReservation) => {
              const currentRoomId = reservation.roomId;
              const RoomName = rooms.find((room: Room) => room.id === currentRoomId)?.name ?? currentRoomId;
              return (
                <MyReservationRoom
                  roomName={RoomName}
                  description={`${reservation.date} ${reservation.start}~${reservation.end} · ${
                    reservation.attendees
                  }명 · ${reservation.equipment.map((e: string) => EQUIPMENT_LABELS[e]).join(', ') || '장비 없음'}`}
                  key={reservation.id}
                >
                  <Button
                    type="danger"
                    style="weak"
                    size="small"
                    onClick={e => {
                      e.stopPropagation();
                      if (window.confirm('정말 취소하시겠습니까?')) {
                        cancelReservation(reservation.id)
                          .then(() => {
                            queryClient.invalidateQueries({ queryKey: ['reservations'] });
                            queryClient.invalidateQueries({ queryKey: ['myReservations'] });
                            setMessage({ type: 'success', text: '예약이 취소되었습니다.' });
                          })
                          .catch(() => {
                            setMessage({ type: 'error', text: '취소에 실패했습니다.' });
                          });
                      }
                    }}
                  >
                    취소
                  </Button>
                </MyReservationRoom>
              );
            })}
          </div>
        )}
      </Section>

      <Spacing size={24} />
      <Border size={8} />
      <Spacing size={24} />

      {/* 예약하기 버튼 */}
      <div
        css={css`
          padding: 0 24px;
        `}
      >
        <Button display="full" onClick={() => navigate('/booking')}>
          예약하기
        </Button>
      </div>
      <Spacing size={24} />
    </div>
  );
}

type DatePickerType = {
  minDate: string;
  selectedDate: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

function DatePicker({ minDate, selectedDate, onChange }: DatePickerType) {
  return (
    <div
      css={css`
        display: flex;
        flex-direction: column;
        gap: 6px;
      `}
    >
      <input
        type="date"
        value={selectedDate}
        min={minDate}
        onChange={onChange}
        aria-label="날짜"
        css={css`
          box-sizing: border-box;
          font-size: 16px;
          font-weight: 500;
          line-height: 1.5;
          height: 48px;
          background-color: ${colors.grey50};
          border-radius: 12px;
          color: ${colors.grey800};
          width: 100%;
          border: 1px solid ${colors.grey200};
          padding: 0 16px;
          outline: none;
          transition: border-color 0.15s;
          &:focus {
            border-color: ${colors.blue500};
          }
        `}
      />
    </div>
  );
}

type MyReservationRoom = {
  roomName: string;
  description: string;
  children: React.ReactNode;
};

function MyReservationRoom({ roomName, description, children }: MyReservationRoom) {
  return (
    <div
      css={css`
        padding: 14px 16px;
        border-radius: 14px;
        background: ${colors.grey50};
        border: 1px solid ${colors.grey200};
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

type EmptyReservation = {
  title: string;
};

function EmptyReservation({ title }: EmptyReservation) {
  return (
    <div
      css={css`
        padding: 40px 0;
        text-align: center;
        background: ${colors.grey50};
        border-radius: 14px;
      `}
    >
      <Text typography="t6" color={colors.grey500}>
        {title}
      </Text>
    </div>
  );
}
