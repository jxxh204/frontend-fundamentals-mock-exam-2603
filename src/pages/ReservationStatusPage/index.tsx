import { css } from '@emotion/react';
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Top, Spacing, Border, Button, Text, ListRow } from '_tosslib/components';
import { colors } from '_tosslib/constants/colors';
import { getRooms, getReservations, getMyReservations, cancelReservation } from 'pages/remotes';
import { formatDate } from './utils';
import { Tooltip } from './ui/Tooltip';
import { Section } from './ui/Section';

type Room = {
  id: string;
  name: string;
};

type Reservation = {
  id: string;
  roomId: string;
  start: string;
  end: string;
  attendees: number;
  equipment: string[];
};

type MyReservation = Reservation & {
  date: string;
};

// 회의실별 타임라인 > 툴팁, 내 예약
const EQUIPMENT_LABELS: Record<string, string> = {
  tv: 'TV',
  whiteboard: '화이트보드',
  video: '화상장비',
  speaker: '스피커',
};

// 시간 헤더, 회의실별 타임 라인
const TIMELINE_START = 9;
const TIMELINE_END = 20;
const TOTAL_MINUTES = (TIMELINE_END - TIMELINE_START) * 60;
function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (h - TIMELINE_START) * 60 + m;
}

export function ReservationStatusPage() {
  const navigate = useNavigate(); // 예약하기 버튼
  const queryClient = useQueryClient();

  const [date, setDate] = useState(formatDate(new Date()));

  // 회의실 별 타임라인, 내 예약
  const [activeReservation, setActiveReservation] = useState<string | null>(null);
  const { data: reservations = [] } = useQuery(['reservations', date], () => getReservations(date), {
    enabled: !!date,
  });

  // 회의실 별 타임라인, 내 예약
  const { data: rooms = [] } = useQuery(['rooms'], getRooms);

  // 내 예약
  const { data: myReservationList = [] } = useQuery(['myReservations'], getMyReservations);
  const cancelMutation = useMutation((id: string) => cancelReservation(id), {
    onSuccess: () => {
      queryClient.invalidateQueries(['reservations']);
      queryClient.invalidateQueries(['myReservations']);
    },
  });

  // 메세지 배너
  const location = useLocation();
  const locationState = location.state as { message?: string } | null;
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    locationState?.message ? { type: 'success', text: locationState.message } : null
  );

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

      {/* 날짜 선택 */}
      <div
        css={css`
          padding: 0 24px;
        `}
      >
        <Text typography="t5" fontWeight="bold" color={colors.grey900}>
          날짜 선택
        </Text>
        <Spacing size={16} />
        <DatePicker selectedDate={date} minDate={formatDate(new Date())} onChange={e => setDate(e.target.value)} />
      </div>

      <Spacing size={24} />
      <Border size={8} />
      <Spacing size={24} />

      {/* 예약 현황 타임라인 */}
      <Section>
        <Text typography="t5" fontWeight="bold" color={colors.grey900}>
          예약 현황
        </Text>
        <Spacing size={16} />

        <div
          css={css`
            background: ${colors.grey50};
            border-radius: 14px;
            padding: 16px;
          `}
        >
          <TimeLineHeader start={9} end={20} />

          {/* 회의실별 타임라인 */}
          {rooms.map((room: Room, index: number) => {
            const roomReservations = reservations.filter((r: Reservation) => r.roomId === room.id);
            return (
              <div
                key={room.id}
                css={css`
                  display: flex;
                  align-items: center;
                  height: 32px;
                  ${index > 0 ? 'margin-top: 4px;' : ''}
                `}
              >
                {/* 룸 네임 */}
                <TimeLineRoom name={room.name} />

                {/* 타임라인 */}
                <div
                  css={css`
                    flex: 1;
                    height: 24px;
                    background: ${colors.white};
                    border-radius: 6px;
                    position: relative;
                    overflow: visible;
                  `}
                >
                  {roomReservations.map((res: Reservation) => {
                    const isActive = activeReservation === res.id;
                    return (
                      <ReservationBar
                        key={res.id}
                        res={res}
                        onClick={() => setActiveReservation(isActive ? null : res.id)}
                        roomName={room.name}
                        isActive={isActive}
                      >
                        <Tooltip>
                          <>
                            <div>
                              {res.start} ~ {res.end}
                            </div>
                            <div>{res.attendees}명</div>
                            {res.equipment.length > 0 && (
                              <div>{res.equipment.map((e: string) => EQUIPMENT_LABELS[e]).join(', ')}</div>
                            )}
                          </>
                        </Tooltip>
                      </ReservationBar>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      <Spacing size={24} />
      <Border size={8} />
      <Spacing size={24} />

      {/* 메시지 배너 */}
      {message && (
        <Section>
          <div
            css={css`
              padding: 10px 14px;
              border-radius: 10px;
              background: ${message.type === 'success' ? colors.blue50 : colors.red50};
              display: flex;
              align-items: center;
              gap: 8px;
            `}
          >
            <Text
              typography="t7"
              fontWeight="medium"
              color={message.type === 'success' ? colors.blue600 : colors.red500}
            >
              {message.text}
            </Text>
          </div>
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
          <div
            css={css`
              padding: 40px 0;
              text-align: center;
              background: ${colors.grey50};
              border-radius: 14px;
            `}
          >
            <Text typography="t6" color={colors.grey500}>
              예약 내역이 없습니다.
            </Text>
          </div>
        ) : (
          <div
            css={css`
              display: flex;
              flex-direction: column;
              gap: 10px;
            `}
          >
            {myReservationList.map((res: MyReservation) => {
              const getRoomName = (roomId: string) => rooms.find((r: Room) => r.id === roomId)?.name ?? roomId;
              return (
                <div
                  key={res.id}
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
                        top={getRoomName(res.roomId)}
                        topProps={{ typography: 't6', fontWeight: 'bold', color: colors.grey900 }}
                        bottom={`${res.date} ${res.start}~${res.end} · ${res.attendees}명 · ${
                          res.equipment.map((e: string) => EQUIPMENT_LABELS[e]).join(', ') || '장비 없음'
                        }`}
                        bottomProps={{ typography: 't7', color: colors.grey600 }}
                      />
                    }
                    right={
                      <Button
                        type="danger"
                        style="weak"
                        size="small"
                        onClick={e => {
                          e.stopPropagation();
                          if (window.confirm('정말 취소하시겠습니까?')) {
                            const handleCancel = async (id: string) => {
                              try {
                                await cancelMutation.mutateAsync(id);
                                setMessage({ type: 'success', text: '예약이 취소되었습니다.' });
                              } catch {
                                setMessage({ type: 'error', text: '취소에 실패했습니다.' });
                              }
                            };
                            handleCancel(res.id);
                          }
                        }}
                      >
                        취소
                      </Button>
                    }
                  />
                </div>
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

type TimeLineHeaderType = {
  start: number;
  end: number;
};

function TimeLineHeader({ start, end }: TimeLineHeaderType) {
  const TOTAL_MINUTES = (end - start) * 60;
  // 시간 헤더
  const TIME_SLOTS: string[] = [];
  for (let h = 9; h <= 20; h++) {
    TIME_SLOTS.push(`${String(h).padStart(2, '0')}:00`);
    if (h < 20) {
      TIME_SLOTS.push(`${String(h).padStart(2, '0')}:30`);
    }
  }

  const HOUR_LABELS = TIME_SLOTS.filter(t => t.endsWith(':00'));
  return (
    <div
      css={css`
        display: flex;
        align-items: flex-end;
        margin-bottom: 8px;
      `}
    >
      <div
        css={css`
          width: 80px;
          flex-shrink: 0;
          padding-right: 8px;
        `}
      />
      <div
        css={css`
          flex: 1;
          position: relative;
          height: 18px;
        `}
      >
        {HOUR_LABELS.map(t => {
          const left = (timeToMinutes(t) / TOTAL_MINUTES) * 100;
          return (
            <Text
              key={t}
              typography="t7"
              fontWeight="regular"
              color={colors.grey400}
              css={css`
                position: absolute;
                left: ${left}%;
                transform: translateX(-50%);
                font-size: 10px;
                letter-spacing: -0.3px;
              `}
            >
              {t.slice(0, 2)}
            </Text>
          );
        })}
      </div>
    </div>
  );
}

type TimeLineRoomType = {
  name: string;
};
function TimeLineRoom({ name }: TimeLineRoomType) {
  return (
    <div
      css={css`
        width: 80px;
        flex-shrink: 0;
        padding-right: 8px;
      `}
    >
      <Text
        typography="t7"
        fontWeight="medium"
        color={colors.grey700}
        ellipsisAfterLines={1}
        css={css`
          font-size: 12px;
        `}
      >
        {name}
      </Text>
    </div>
  );
}

type ReservationBarType = {
  res: Reservation;
  onClick: () => void;
  roomName: string;
  isActive: boolean;
  children: React.ReactNode;
};

function ReservationBar({ res, onClick, roomName, isActive, children }: ReservationBarType) {
  const left = (timeToMinutes(res.start) / TOTAL_MINUTES) * 100;
  const width = ((timeToMinutes(res.end) - timeToMinutes(res.start)) / TOTAL_MINUTES) * 100;
  return (
    <div
      css={css`
        position: absolute;
        left: ${left}%;
        width: ${width}%;
        height: 100%;
      `}
    >
      <div
        role="button"
        aria-label={`${roomName} ${res.start}-${res.end} 예약 상세`}
        onClick={onClick}
        css={css`
          width: 100%;
          height: 100%;
          background: ${colors.blue400};
          border-radius: 4px;
          opacity: ${isActive ? 1 : 0.75};
          cursor: pointer;
          transition: opacity 0.15s;
          &:hover {
            opacity: 1;
          }
        `}
      />
      {isActive && children}
    </div>
  );
}
