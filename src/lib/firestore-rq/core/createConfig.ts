import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

interface ConfigDocumentConfig {
  basePath: string;
  projectId: string;
  name: string;
}

export function createConfig<T extends object>(config: ConfigDocumentConfig) {
  const { projectId, name } = config;

  function useDocument(docId?: string | null) {
    const docParam = docId ? `?docId=${encodeURIComponent(docId)}` : '';
    return useQuery<T | null>({
      queryKey: ['config', projectId, name, docId ?? '__default__'],
      queryFn: () => apiClient.getOne<T>(`/config/${projectId}/${name}${docParam}`),
      staleTime: 60_000,
    });
  }

  function useSet() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, data }: { id: string; data: Partial<T> }) =>
        apiClient.put<T>(`/config/${projectId}/${name}?docId=${encodeURIComponent(id)}`, data),
      onSuccess: (_, { id }) => {
        queryClient.invalidateQueries({ queryKey: ['config', projectId, name, id] });
        queryClient.invalidateQueries({ queryKey: ['config', projectId, name, '__default__'] });
      },
    });
  }

  const helpers = {
    fetch: (docId?: string) => {
      const docParam = docId ? `?docId=${encodeURIComponent(docId)}` : '';
      return apiClient.getOne<T>(`/config/${projectId}/${name}${docParam}`);
    },
    set: (id: string, data: Partial<T>) =>
      apiClient.put<T>(`/config/${projectId}/${name}?docId=${encodeURIComponent(id)}`, data),
  };

  return { useDocument, useSet, helpers };
}
