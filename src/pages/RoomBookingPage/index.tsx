import { css } from '@emotion/react';
import { Suspense, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { Top, Spacing, Border, Button, Text, Select } from '_tosslib/components';
import { colors } from '_tosslib/constants/colors';
import { getRooms, createReservation } from 'pages/remotes';
import axios from 'axios';
import { DatePicker } from 'pages/components/DatePicker';
import { NumberStepper } from 'pages/components/NumberStepper';
import { ChipGroup } from 'pages/components/ChipGroup';
import { Section } from 'pages/ui/Section';
import { EQUIPMENT_LABELS, TIMELINE_END, TIMELINE_START } from 'pages/constants';
import { generateTimeSlots } from 'pages/utils';
import { AvailableRoomList } from './AvailableRoomList';

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
    handleSubmit,
    watch,
    getValues,
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

  const syncToUrl = () => {
    const { date, startTime, endTime, attendees, equipment, preferredFloor } = getValues();
    const params: Record<string, string> = {};
    if (date) params.date = date;
    if (startTime) params.startTime = startTime;
    if (endTime) params.endTime = endTime;
    if (attendees > 1) params.attendees = String(attendees);
    if (equipment.length > 0) params.equipment = equipment.join(',');
    if (preferredFloor !== null) params.floor = String(preferredFloor);
    setSearchParams(params, { replace: true });
  };

  const { data: rooms = [] } = useQuery({ queryKey: ['rooms'], queryFn: getRooms });

  const hasTimeInputs = startTime !== '' && endTime !== '';
  const isFilterComplete = hasTimeInputs && !errors.endTime && !errors.attendees;

  const handleError = (message: string) => {
    setErrorMessage(message);
    setValue('selectedRoomId', null);
  };

  const createMutation = useMutation({
    mutationFn: createReservation,
    onSuccess: (result, variables) => {
      if ('ok' in result && result.ok) {
        queryClient.invalidateQueries({ queryKey: ['reservations', variables.date] });
        queryClient.invalidateQueries({ queryKey: ['myReservations'] });
        navigate('/', { state: { message: '예약이 완료되었습니다!' } });
        return;
      }
      const errResult = result as { message?: string };
      handleError(errResult.message ?? '예약에 실패했습니다.');
    },
    onError: (err: unknown) => {
      const message =
        axios.isAxiosError(err) && (err.response?.data as { message?: string })?.message
          ? (err.response!.data as { message: string }).message
          : '예약에 실패했습니다.';
      handleError(message);
    },
  });

  const resetSelection = () => {
    setValue('selectedRoomId', null);
    setErrorMessage(null);
    syncToUrl();
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
            <Controller
              name="attendees"
              control={control}
              rules={{
                min: { value: 1, message: '참석 인원은 1명 이상이어야 합니다.' },
              }}
              render={({ field }) => (
                <NumberStepper
                  value={field.value}
                  onChange={(v: number) => {
                    field.onChange(v);
                    resetSelection();
                  }}
                  min={1}
                  aria-label="참석 인원"
                />
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
                  {[...new Set(rooms.map((room: { floor: number }) => room.floor))]
                    .sort((a: number, b: number) => a - b)
                    .map((f: number) => (
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
              <ChipGroup
                options={Object.entries(EQUIPMENT_LABELS).map(([value, label]) => ({ value, label }))}
                selected={field.value}
                onChange={(next: string[]) => {
                  field.onChange(next);
                  resetSelection();
                }}
              />
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
        <Section>
          <Suspense fallback={<div>로딩 중...</div>}>
            <Controller
              name="selectedRoomId"
              control={control}
              render={({ field }) => (
                <AvailableRoomList
                  title="예약 가능 회의실"
                  filter={{ date, startTime, endTime, attendees, equipment, preferredFloor }}
                  selectedRoomId={field.value}
                  onSelect={field.onChange}
                />
                //TODO :   룸 컴포넌트가 보이도록 개선 필요
              )}
            />
          </Suspense>

          <Spacing size={16} />
          <Button
            display="full"
            onClick={handleSubmit(data => {
              if (!data.selectedRoomId) {
                setErrorMessage('회의실을 선택해주세요.');
                return;
              }
              createMutation.mutate({
                roomId: data.selectedRoomId,
                date: data.date,
                start: data.startTime,
                end: data.endTime,
                attendees: data.attendees,
                equipment: data.equipment,
              });
            })}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? '예약 중...' : '확정'}
          </Button>
        </Section>
      )}

      <Spacing size={24} />
    </div>
  );
}
