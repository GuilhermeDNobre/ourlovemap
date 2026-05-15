import { useMutation } from '@tanstack/react-query';
import api from '../lib/api';
import { useWizardStore } from '../stores/wizard-store';

interface CreateMapResponse {
  mapId: string;
}

export function useCreateMap() {
  const { setField } = useWizardStore();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await api.post<CreateMapResponse>('/api/maps', formData);
      return response.data;
    },
    onSuccess: (data) => {
      setField('mapId', data.mapId);
    },
  });
}
