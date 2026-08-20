import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getErrorMessage } from '@/lib/errors';
import { useServiceOrders } from '@/features/orders/queries';

const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export function FinancePage() {
  const { data: orders, isLoading, isError, error } = useServiceOrders();
  const navigate = useNavigate();

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filtered = useMemo(() => {
    return (orders ?? []).filter((o) => {
      const matchesFrom = !dateFrom || o.opened_at >= dateFrom;
      const matchesTo = !dateTo || o.opened_at <= dateTo;
      return matchesFrom && matchesTo;
    });
  }, [orders, dateFrom, dateTo]);

  const receivable = filtered
    .filter((o) => !o.paid)
    .reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Financeiro</h1>
        <p className="text-muted-foreground text-sm">
          Situação de pagamento das ordens (pago × a receber).
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
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

      <Card>
        <CardHeader>
          <CardTitle>Total a receber</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">{brl.format(receivable)}</p>
        </CardContent>
      </Card>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Carregando…</p>
      ) : isError ? (
        <p className="text-destructive text-sm">{getErrorMessage(error)}</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Nenhuma OS no período selecionado.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead className="text-right">Valor pago</TableHead>
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
                  <TableCell className="text-right">
                    {brl.format(order.total)}
                  </TableCell>
                  <TableCell>
                    <span
                      className={
                        order.paid
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-destructive'
                      }
                    >
                      {order.paid ? 'Pago' : 'A receber'}
                    </span>
                    {order.paid &&
                    order.amount_paid != null &&
                    order.amount_paid < order.total ? (
                      <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        pago a menor
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-right">
                    {order.amount_paid != null
                      ? brl.format(order.amount_paid)
                      : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
