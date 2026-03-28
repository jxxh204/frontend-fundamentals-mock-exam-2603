import { queryOptions } from '@tanstack/react-query';
import { getReservations } from 'pages/remotes';

export const queries = {
  reservations: Object.assign(
    (date: string) =>
      queryOptions({
        queryKey: [...queries.reservations.queryKey, date],
        queryFn: () => getReservations(date),
      }),
    { queryKey: ['reservations'] }
  ),
} as const;
