import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { serviceOrderRepository } from '@/lib/repositories';
import type {
  ServiceOrderChanges,
  ServiceOrderChildren,
  NewServiceOrder,
} from '@/lib/repositories';

const ordersKey = ['service-orders'] as const;
const orderKey = (id: string) => ['service-orders', id] as const;

export function useServiceOrders() {
  return useQuery({
    queryKey: ordersKey,
    queryFn: () => serviceOrderRepository.list(),
  });
}

export function useServiceOrder(id: string | undefined) {
  return useQuery({
    queryKey: orderKey(id ?? 'new'),
    queryFn: () => serviceOrderRepository.getById(id as string),
    enabled: Boolean(id),
  });
}

/** Número sugerido (RN-01) para uma nova OS. Só busca quando habilitado. */
export function useSuggestedOrderNumber(enabled: boolean) {
  return useQuery({
    queryKey: ['next-order-number'],
    queryFn: () => serviceOrderRepository.suggestNextNumber(),
    enabled,
    staleTime: 0,
    gcTime: 0,
  });
}

export function useCreateServiceOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      input,
      children,
    }: {
      input: NewServiceOrder;
      children?: ServiceOrderChildren;
    }) => serviceOrderRepository.create(input, children),
    onSuccess: () => qc.invalidateQueries({ queryKey: ordersKey }),
  });
}

export function useUpdateServiceOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changes,
      children,
    }: {
      id: string;
      changes: ServiceOrderChanges;
      children?: ServiceOrderChildren;
    }) => serviceOrderRepository.update(id, changes, children),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ordersKey });
      qc.invalidateQueries({ queryKey: orderKey(id) });
    },
  });
}

export function useDeleteServiceOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => serviceOrderRepository.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ordersKey }),
  });
}
