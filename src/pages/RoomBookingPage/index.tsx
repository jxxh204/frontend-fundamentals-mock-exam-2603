import { css } from '@emotion/react';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { Top, Spacing, Border, Button, Text, Select, ListRow } from '_tosslib/components';
import { colors } from '_tosslib/constants/colors';
import { getRooms, getReservations, createReservation } from 'pages/remotes';
import axios from 'axios';
import { DatePicker } from 'pages/components/DatePicker';
import { Section } from 'pages/ui/Section';
import { EQUIPMENT_LABELS, TIMELINE_END, TIMELINE_START } from 'pages/constants';
import { generateTimeSlots } from 'pages/utils';

const ALL_EQUIPMENT = ['tv', 'whiteboard', 'video', 'speaker'];

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

interface BookingFormValues {
  date: string;
  startTime: string;
  endTime: string;
  attendees: number;
  equipment: string[];
  preferredFloor: number | null;
  selectedRoomId: string | null;
}

export function RoomBookingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<BookingFormValues>({
    mode: 'onChange',
    defaultValues: {
      date: searchParams.get('date') || formatDate(new Date()),
      startTime: searchParams.get('startTime') || '',
      endTime: searchParams.get('endTime') || '',
      attendees: Number(searchParams.get('attendees')) || 1,
      equipment: searchParams.get('equipment')?.split(',').filter(Boolean) ?? [],
      preferredFloor: searchParams.get('floor') ? Number(searchParams.get('floor')) : null,
      selectedRoomId: null,
    },
  });

  const [date, startTime, endTime, attendees, equipment, preferredFloor] = watch([
    'date',
    'startTime',
    'endTime',
    'attendees',
    'equipment',
    'preferredFloor',
  ]);

  const resetSelection = () => {
    setValue('selectedRoomId', null);
    setErrorMessage(null);
  };

  // URL 쿼리 파라미터 동기화
  useEffect(() => {
    const params: Record<string, string> = {};
    if (date) params.date = date;
    if (startTime) params.startTime = startTime;
    if (endTime) params.endTime = endTime;
    if (attendees > 1) params.attendees = String(attendees);
    if (equipment.length > 0) params.equipment = equipment.join(',');
    if (preferredFloor !== null) params.floor = String(preferredFloor);
    setSearchParams(params, { replace: true });
  }, [date, startTime, endTime, attendees, equipment, preferredFloor, setSearchParams]);

  const { data: rooms = [] } = useQuery({ queryKey: ['rooms'], queryFn: getRooms });
  const { data: reservations = [] } = useQuery({
    queryKey: ['reservations', date],
    queryFn: () => getReservations(date),
    enabled: !!date,
  });

  const createMutation = useMutation({
    mutationFn: (data: {
      roomId: string;
      date: string;
      start: string;
      end: string;
      attendees: number;
      equipment: string[];
    }) => createReservation(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reservations', variables.date] });
      queryClient.invalidateQueries({ queryKey: ['myReservations'] });
    },
  });

  const hasTimeInputs = startTime !== '' && endTime !== '';
  const isFilterComplete = hasTimeInputs && !errors.endTime && !errors.attendees;

  // 필터링
  const floors = [...new Set(rooms.map((r: { floor: number }) => r.floor))].sort((a: number, b: number) => a - b);

  const availableRooms = isFilterComplete
    ? rooms
        .filter((room: { id: string; capacity: number; equipment: string[]; floor: number }) => {
          if (room.capacity < attendees) return false;
          if (!equipment.every(eq => room.equipment.includes(eq))) return false;
          if (preferredFloor !== null && room.floor !== preferredFloor) return false;
          const hasConflict = reservations.some(
            (r: { roomId: string; date: string; start: string; end: string }) =>
              r.roomId === room.id && r.date === date && r.start < endTime && r.end > startTime
          );
          if (hasConflict) return false;
          return true;
        })
        .sort((a: { floor: number; name: string }, b: { floor: number; name: string }) => {
          if (a.floor !== b.floor) return a.floor - b.floor;
          return a.name.localeCompare(b.name);
        })
    : [];

  const onSubmit: SubmitHandler<BookingFormValues> = async data => {
    if (!data.selectedRoomId) {
      setErrorMessage('회의실을 선택해주세요.');
      return;
    }

    try {
      const result = await createMutation.mutateAsync({
        roomId: data.selectedRoomId,
        date: data.date,
        start: data.startTime,
        end: data.endTime,
        attendees: data.attendees,
        equipment: data.equipment,
      });

      if ('ok' in result && result.ok) {
        navigate('/', { state: { message: '예약이 완료되었습니다!' } });
        return;
      }

      const errResult = result as { message?: string };
      setErrorMessage(errResult.message ?? '예약에 실패했습니다.');
      setValue('selectedRoomId', null);
    } catch (err: unknown) {
      let serverMessage = '예약에 실패했습니다.';
      if (axios.isAxiosError(err)) {
        const data = err.response?.data as { message?: string } | undefined;
        serverMessage = data?.message ?? serverMessage;
      }
      setErrorMessage(serverMessage);
      setValue('selectedRoomId', null);
    }
  };

  return (
    <div
      css={css`
        background: ${colors.white};
        padding-bottom: 40px;
      `}
    >
      <div
        css={css`
          padding: 12px 24px 0;
        `}
      >
        <button
          type="button"
          onClick={() => navigate('/')}
          aria-label="뒤로가기"
          css={css`
            background: none;
            border: none;
            padding: 0;
            cursor: pointer;
            font-size: 14px;
            color: ${colors.grey600};
            &:hover {
              color: ${colors.grey900};
            }
          `}
        >
          ← 예약 현황으로
        </button>
      </div>
      <Top.Top03
        css={css`
          padding-left: 24px;
          padding-right: 24px;
        `}
      >
        예약하기
      </Top.Top03>

      {errorMessage && (
        <Section>
          <Spacing size={12} />
          <div
            css={css`
              padding: 10px 14px;
              border-radius: 10px;
              background: ${colors.red50};
              display: flex;
              align-items: center;
              gap: 8px;
            `}
          >
            <Text typography="t7" fontWeight="medium" color={colors.red500}>
              {errorMessage}
            </Text>
          </div>
        </Section>
      )}

      <Spacing size={24} />

      <Section>
        <Text typography="t5" fontWeight="bold" color={colors.grey900}>
          예약 조건
        </Text>
        <Spacing size={16} />

        <Controller
          name="date"
          control={control}
          render={({ field }) => (
            <DatePicker
              label="날짜"
              minDate={formatDate(new Date())}
              selectedDate={field.value}
              onChange={e => {
                field.onChange(e.target.value);
                resetSelection();
              }}
            />
          )}
        />

        <Spacing size={14} />

        <div
          css={css`
            display: flex;
            gap: 12px;
          `}
        >
          <div
            css={css`
              display: flex;
              flex-direction: column;
              gap: 6px;
              flex: 1;
            `}
          >
            <Text as="label" typography="t7" fontWeight="medium" color={colors.grey600}>
              시작 시간
            </Text>
            <Controller
              name="startTime"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onChange={e => {
                    field.onChange(e.target.value);
                    trigger('endTime');
                    resetSelection();
                  }}
                  aria-label="시작 시간"
                >
                  <option value="">선택</option>
                  {generateTimeSlots(TIMELINE_START, TIMELINE_END)
                    .slice(0, -1)
                    .map(t => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                </Select>
              )}
            />
          </div>

          <div
            css={css`
              display: flex;
              flex-direction: column;
              gap: 6px;
              flex: 1;
            `}
          >
            <Text as="label" typography="t7" fontWeight="medium" color={colors.grey600}>
              종료 시간
            </Text>
            <Controller
              name="endTime"
              control={control}
              rules={{
                validate: (value, formValues) =>
                  !value ||
                  !formValues.startTime ||
                  value > formValues.startTime ||
                  '종료 시간은 시작 시간보다 늦어야 합니다.',
              }}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onChange={e => {
                    field.onChange(e.target.value);
                    resetSelection();
                  }}
                  aria-label="종료 시간"
                >
                  <option value="">선택</option>
                  {generateTimeSlots(TIMELINE_START, TIMELINE_END)
                    .slice(1)
                    .map(t => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                </Select>
              )}
            />
          </div>
        </div>
        <Spacing size={14} />

        {/* 참석 인원 + 선호 층 */}
        <div
          css={css`
            display: flex;
            gap: 12px;
          `}
        >
          <div
            css={css`
              display: flex;
              flex-direction: column;
              gap: 6px;
              flex: 1;
            `}
          >
            <Text as="label" typography="t7" fontWeight="medium" color={colors.grey600}>
              참석 인원
            </Text>
            <input
              type="number"
              min={1}
              {...register('attendees', {
                valueAsNumber: true,
                min: { value: 1, message: '참석 인원은 1명 이상이어야 합니다.' },
                onChange: () => resetSelection(),
              })}
              aria-label="참석 인원"
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
          <div
            css={css`
              display: flex;
              flex-direction: column;
              gap: 6px;
              flex: 1;
            `}
          >
            <Text as="label" typography="t7" fontWeight="medium" color={colors.grey600}>
              선호 층
            </Text>
            <Controller
              name="preferredFloor"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value ?? ''}
                  onChange={e => {
                    const val = e.target.value;
                    field.onChange(val === '' ? null : Number(val));
                    resetSelection();
                  }}
                  aria-label="선호 층"
                >
                  <option value="">전체</option>
                  {floors.map((f: number) => (
                    <option key={f} value={f}>
                      {f}층
                    </option>
                  ))}
                </Select>
              )}
            />
          </div>
        </div>
        <Spacing size={14} />

        {/* 장비 */}
        <div>
          <Text as="label" typography="t7" fontWeight="medium" color={colors.grey600}>
            필요 장비
          </Text>
          <Spacing size={8} />
          <Controller
            name="equipment"
            control={control}
            render={({ field }) => (
              <div
                css={css`
                  display: flex;
                  gap: 8px;
                  flex-wrap: wrap;
                `}
              >
                {ALL_EQUIPMENT.map(eq => {
                  const selected = field.value.includes(eq);
                  return (
                    <button
                      key={eq}
                      type="button"
                      onClick={() => {
                        const next = selected ? field.value.filter(e => e !== eq) : [...field.value, eq];
                        field.onChange(next);
                        resetSelection();
                      }}
                      aria-label={EQUIPMENT_LABELS[eq]}
                      aria-pressed={selected}
                      css={css`
                        padding: 8px 16px;
                        border-radius: 20px;
                        border: 1px solid ${selected ? colors.blue500 : colors.grey200};
                        background: ${selected ? colors.blue50 : colors.grey50};
                        color: ${selected ? colors.blue600 : colors.grey700};
                        font-size: 14px;
                        font-weight: 500;
                        cursor: pointer;
                        transition: all 0.15s;
                        &:hover {
                          border-color: ${selected ? colors.blue500 : colors.grey400};
                        }
                      `}
                    >
                      {EQUIPMENT_LABELS[eq]}
                    </button>
                  );
                })}
              </div>
            )}
          />
        </div>
      </Section>

      {(errors.endTime || errors.attendees) && (
        <div
          css={css`
            padding: 0 24px;
          `}
        >
          <Spacing size={8} />
          <span
            css={css`
              color: ${colors.red500};
              font-size: 14px;
            `}
            role="alert"
          >
            {errors.endTime?.message || errors.attendees?.message}
          </span>
        </div>
      )}

      <Spacing size={24} />
      <Border size={8} />
      <Spacing size={24} />

      {/* 예약 가능 회의실 목록 */}
      {isFilterComplete && (
        <div
          css={css`
            padding: 0 24px;
          `}
        >
          <div
            css={css`
              display: flex;
              align-items: baseline;
              gap: 6px;
            `}
          >
            <Text typography="t5" fontWeight="bold" color={colors.grey900}>
              예약 가능 회의실
            </Text>
            <Text typography="t7" fontWeight="medium" color={colors.grey500}>
              {availableRooms.length}개
            </Text>
          </div>
          <Spacing size={16} />

          {availableRooms.length === 0 ? (
            <div
              css={css`
                padding: 40px 0;
                text-align: center;
                background: ${colors.grey50};
                border-radius: 14px;
              `}
            >
              <Text typography="t6" color={colors.grey500}>
                조건에 맞는 회의실이 없습니다.
              </Text>
            </div>
          ) : (
            <Controller
              name="selectedRoomId"
              control={control}
              render={({ field }) => (
                <div
                  css={css`
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                  `}
                >
                  {availableRooms.map(
                    (room: { id: string; name: string; floor: number; capacity: number; equipment: string[] }) => {
                      const isSelected = field.value === room.id;
                      return (
                        <div
                          key={room.id}
                          onClick={() => field.onChange(room.id)}
                          role="button"
                          aria-pressed={isSelected}
                          aria-label={room.name}
                          css={css`
                            cursor: pointer;
                            padding: 14px 16px;
                            border-radius: 14px;
                            border: 2px solid ${isSelected ? colors.blue500 : colors.grey200};
                            background: ${isSelected ? colors.blue50 : colors.white};
                            transition: all 0.15s;
                            &:hover {
                              border-color: ${isSelected ? colors.blue500 : colors.grey300};
                            }
                          `}
                        >
                          <ListRow
                            contents={
                              <ListRow.Text2Rows
                                top={room.name}
                                topProps={{ typography: 't6', fontWeight: 'bold', color: colors.grey900 }}
                                bottom={`${room.floor}층 · ${room.capacity}명 · ${room.equipment
                                  .map((e: string) => EQUIPMENT_LABELS[e])
                                  .join(', ')}`}
                                bottomProps={{ typography: 't7', color: colors.grey600 }}
                              />
                            }
                            right={
                              isSelected ? (
                                <Text typography="t7" fontWeight="bold" color={colors.blue500}>
                                  선택됨
                                </Text>
                              ) : undefined
                            }
                          />
                        </div>
                      );
                    }
                  )}
                </div>
              )}
            />
          )}

          <Spacing size={16} />
          <Button display="full" onClick={handleSubmit(onSubmit)} disabled={createMutation.isPending}>
            {createMutation.isPending ? '예약 중...' : '확정'}
          </Button>
        </div>
      )}

      <Spacing size={24} />
    </div>
  );
}
