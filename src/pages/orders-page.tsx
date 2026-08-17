import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PlusIcon, Trash2Icon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { getErrorMessage } from '@/lib/errors';
import type { ServiceOrderListItem } from '@/lib/repositories';
import {
  useDeleteServiceOrder,
  useServiceOrders,
} from '@/features/orders/queries';

const statusLabels: Record<string, string> = {
  open: 'Aberta',
  in_progress: 'Em andamento',
  completed: 'Concluída',
};

const statusFilters = [
  { value: 'all', label: 'Todos os status' },
  { value: 'open', label: 'Aberta' },
  { value: 'in_progress', label: 'Em andamento' },
  { value: 'completed', label: 'Concluída' },
];

const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export function OrdersPage() {
  const { data: orders, isLoading, isError, error } = useServiceOrders();
  const deleteOrder = useDeleteServiceOrder();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [deleting, setDeleting] = useState<ServiceOrderListItem | null>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (orders ?? []).filter((o) => {
      const matchesTerm =
        !term ||
        o.number.toLowerCase().includes(term) ||
        o.client_name.toLowerCase().includes(term);
      const matchesStatus = status === 'all' || o.status === status;
      return matchesTerm && matchesStatus;
    });
  }, [orders, search, status]);

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await deleteOrder.mutateAsync(deleting.id);
      toast.success('OS excluída');
    } catch (err) {
      toast.error('Não foi possível excluir', {
        description: getErrorMessage(err),
      });
      throw err;
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Ordens de Serviço</h1>
          <p className="text-muted-foreground text-sm">
            Criar, atender e acompanhar ordens de serviço.
          </p>
        </div>
        <Button render={<Link to="/ordens/nova" />}>
          <PlusIcon />
          Nova OS
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Buscar por número ou cliente…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <select
          className="border-input bg-transparent dark:bg-input/30 h-8 rounded-lg border px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          {statusFilters.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Carregando…</p>
      ) : isError ? (
        <p className="text-destructive text-sm">{getErrorMessage(error)}</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          {search || status !== 'all'
            ? 'Nenhuma OS encontrada.'
            : 'Nenhuma OS cadastrada.'}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((order) => (
                <TableRow
                  key={order.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/ordens/${order.id}`)}
                >
                  <TableCell className="font-medium">{order.number}</TableCell>
                  <TableCell>{order.client_name || '—'}</TableCell>
                  <TableCell>{formatDate(order.opened_at)}</TableCell>
                  <TableCell>{statusLabels[order.status]}</TableCell>
                  <TableCell className="text-right">
                    {brl.format(order.total)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Excluir"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleting(order);
                      }}
                    >
                      <Trash2Icon />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Excluir OS"
        description={
          deleting
            ? `Remover a OS ${deleting.number}? Esta ação não pode ser desfeita.`
            : ''
        }
        confirmLabel="Excluir"
        destructive
        onConfirm={confirmDelete}
      />
    </div>
  );
}
