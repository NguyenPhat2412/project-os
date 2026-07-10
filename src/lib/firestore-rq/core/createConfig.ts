import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

interface ConfigDocumentConfig {
  basePath: string;
  projectId: string;
  name: string;
}

export function createConfig<T extends object>(config: ConfigDocumentConfig) {
  const { projectId, name } = config;
  const identityPath = name === 'profile'
    ? '/v1/users/me/profile'
    : name === 'theme'
      ? '/v1/users/me/preferences/appearance'
      : null;

  const fetchDocument = (docId?: string) => {
    if (identityPath) return apiClient.getOne<T>(identityPath);
    const docParam = docId ? `?docId=${encodeURIComponent(docId)}` : '';
    return apiClient.getOne<T>(`/config/${projectId}/${name}${docParam}`);
  };

  const saveDocument = (docId: string, data: Partial<T>) => {
    if (name === 'profile') return apiClient.patch<T>(identityPath!, data);
    if (name === 'theme') return apiClient.put<T>(identityPath!, data);
    return apiClient.put<T>(`/config/${projectId}/${name}?docId=${encodeURIComponent(docId)}`, data);
  };

  function useDocument(docId?: string | null) {
    return useQuery<T | null>({
      queryKey: ['config', projectId, name, docId ?? '__default__'],
      queryFn: () => fetchDocument(docId ?? undefined),
    });
  }

  function useSet() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, data }: { id: string; data: Partial<T> }) =>
        saveDocument(id, data),
      onSuccess: (_, { id }) => {
        queryClient.invalidateQueries({ queryKey: ['config', projectId, name, id] });
        queryClient.invalidateQueries({ queryKey: ['config', projectId, name, '__default__'] });
      },
    });
  }

  const helpers = {
    fetch: fetchDocument,
    set: saveDocument,
  };

  return { useDocument, useSet, helpers };
}
