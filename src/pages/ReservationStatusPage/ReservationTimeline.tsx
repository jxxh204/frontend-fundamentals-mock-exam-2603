import { css } from '@emotion/react';
import { useState } from 'react';
import { useSuspenseQueries } from '@tanstack/react-query';
import { Text } from '_tosslib/components';
import { colors } from '_tosslib/constants/colors';
import { getRooms, getReservations } from 'pages/remotes';
import { generateTimeSlots, timeToMinutes } from '../utils';
import { Tooltip } from '../ui/Tooltip';
import type { Room, Reservation } from './types';
import { EQUIPMENT_LABELS, TIMELINE_END, TIMELINE_START, TOTAL_MINUTES } from 'pages/constants';

export function ReservationTimeline({ date }: { date: string }) {
  const [{ data: rooms }, { data: reservations }] = useSuspenseQueries({
    queries: [
      { queryKey: ['rooms'], queryFn: getRooms },
      { queryKey: ['reservations', date], queryFn: () => getReservations(date) },
    ],
  });

  const [activeReservation, setActiveReservation] = useState<string | null>(null);

  return (
    <div
      css={css`
        background: ${colors.grey50};
        border-radius: 14px;
        padding: 16px;
      `}
    >
      <TimeLineHeader start={TIMELINE_START} end={TIMELINE_END} />
      {rooms.map((room: Room, index: number) => (
        <div
          key={room.id}
          css={css`
            display: flex;
            align-items: center;
            height: 32px;
            ${index > 0 ? 'margin-top: 4px;' : ''}
          `}
        >
          <TimeLineRoom name={room.name} />
          <TimeLineTrack>
            {reservations
              .filter((r: Reservation) => r.roomId === room.id)
              .map((res: Reservation) => {
                const isActive = activeReservation === res.id;

                return (
                  <div
                    key={res.id}
                    css={css`
                      position: absolute;
                      left: ${(timeToMinutes(TIMELINE_START, res.start) / TOTAL_MINUTES) * 100}%;
                      width: ${((timeToMinutes(TIMELINE_START, res.end) - timeToMinutes(TIMELINE_START, res.start)) /
                        TOTAL_MINUTES) *
                      100}%;
                      height: 100%;
                    `}
                  >
                    <div
                      role="button"
                      aria-label={`${room.name} ${res.start}-${res.end} 예약 상세`}
                      onClick={() => setActiveReservation(isActive ? null : res.id)}
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
                    {isActive && (
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
                    )}
                  </div>
                );
              })}
          </TimeLineTrack>
        </div>
      ))}
    </div>
  );
}

function TimeLineHeader({ start, end }: { start: number; end: number }) {
  const TOTAL_MINUTES = (end - start) * 60;
  const HOUR_LABELS = generateTimeSlots(start, end).filter(t => t.endsWith(':00'));
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
          const left = (timeToMinutes(TIMELINE_START, t) / TOTAL_MINUTES) * 100;
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

function TimeLineRoom({ name }: { name: string }) {
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

function TimeLineTrack({ children }: { children: React.ReactNode }) {
  return (
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
      {children}
    </div>
  );
}
