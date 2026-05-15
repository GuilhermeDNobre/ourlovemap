import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import type { MapApiResponse } from '../types/map';

export function useMapData() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  return useQuery({
    queryKey: ['map', token],
    queryFn: async () => {
      const response = await api.get<MapApiResponse>(`/api/maps/by-token?token=${token}`);
      return response.data;
    },
    enabled: !!token,
    staleTime: Infinity,
    retry: false,
  });
}
