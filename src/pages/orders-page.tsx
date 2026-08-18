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
import type {
  ServiceOrderListItem,
  ServiceOrderStatus,
} from '@/lib/repositories';
import {
  useDeleteServiceOrder,
  useServiceOrders,
  useUpdateServiceOrder,
} from '@/features/orders/queries';

const statusOptions: { value: ServiceOrderStatus; label: string }[] = [
  { value: 'open', label: 'Aberta' },
  { value: 'in_progress', label: 'Em andamento' },
  { value: 'completed', label: 'Concluída' },
];

const statusFilters = [
  { value: 'all', label: 'Todos os status' },
  ...statusOptions,
];

const paidFilters = [
  { value: 'all', label: 'Pagamento: todos' },
  { value: 'paid', label: 'Pago' },
  { value: 'unpaid', label: 'A receber' },
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
  const updateOrder = useUpdateServiceOrder();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [paidFilter, setPaidFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [deleting, setDeleting] = useState<ServiceOrderListItem | null>(null);

  const hasActiveFilters =
    Boolean(search) ||
    status !== 'all' ||
    paidFilter !== 'all' ||
    Boolean(dateFrom) ||
    Boolean(dateTo);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (orders ?? []).filter((o) => {
      const matchesTerm =
        !term ||
        o.number.toLowerCase().includes(term) ||
        o.client_name.toLowerCase().includes(term);
      const matchesStatus = status === 'all' || o.status === status;
      const matchesPaid =
        paidFilter === 'all' || (paidFilter === 'paid' ? o.paid : !o.paid);
      // opened_at é `date` (YYYY-MM-DD); comparação de string basta, sem Date().
      const matchesFrom = !dateFrom || o.opened_at >= dateFrom;
      const matchesTo = !dateTo || o.opened_at <= dateTo;
      return (
        matchesTerm && matchesStatus && matchesPaid && matchesFrom && matchesTo
      );
    });
  }, [orders, search, status, paidFilter, dateFrom, dateTo]);

  // Ação rápida de campo: muda o status sem abrir o editor. Sem `children`,
  // a mutation preserva itens/deslocamentos existentes (semântica da F2-01).
  async function handleStatusChange(orderId: string, next: ServiceOrderStatus) {
    try {
      await updateOrder.mutateAsync({ id: orderId, changes: { status: next } });
      toast.success('Status atualizado');
    } catch (err) {
      toast.error('Não foi possível atualizar o status', {
        description: getErrorMessage(err),
      });
    }
  }

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

      <div className="flex flex-wrap items-center gap-2">
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
        <select
          className="border-input bg-transparent dark:bg-input/30 h-8 rounded-lg border px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3"
          value={paidFilter}
          onChange={(e) => setPaidFilter(e.target.value)}
        >
          {paidFilters.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-1">
          <Input
            type="date"
            aria-label="Data inicial"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-auto"
          />
          <span className="text-muted-foreground text-sm">até</span>
          <Input
            type="date"
            aria-label="Data final"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-auto"
          />
        </div>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Carregando…</p>
      ) : isError ? (
        <p className="text-destructive text-sm">{getErrorMessage(error)}</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          {hasActiveFilters
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
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <select
                      aria-label={`Status da OS ${order.number}`}
                      className="border-input bg-transparent dark:bg-input/30 h-8 rounded-lg border px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3"
                      value={order.status}
                      onChange={(e) =>
                        handleStatusChange(
                          order.id,
                          e.target.value as ServiceOrderStatus,
                        )
                      }
                    >
                      {statusOptions.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </TableCell>
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
