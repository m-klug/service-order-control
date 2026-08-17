import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { clientRepository } from '@/lib/repositories';
import type { ClientChanges, NewClient } from '@/lib/repositories';

const clientsKey = ['clients'] as const;

export function useClients() {
  return useQuery({
    queryKey: clientsKey,
    queryFn: () => clientRepository.list(),
  });
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewClient) => clientRepository.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: clientsKey }),
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, changes }: { id: string; changes: ClientChanges }) =>
      clientRepository.update(id, changes),
    onSuccess: () => qc.invalidateQueries({ queryKey: clientsKey }),
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => clientRepository.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: clientsKey }),
  });
}
