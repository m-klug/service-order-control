import { useMemo, useState } from 'react';
import { PlusIcon, PencilIcon, Trash2Icon } from 'lucide-react';
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
import type { Client } from '@/lib/repositories';
import { useClients, useDeleteClient } from '@/features/clients/queries';
import { ClientFormDialog } from '@/features/clients/client-form-dialog';

export function ClientsPage() {
  const { data: clients, isLoading, isError, error } = useClients();
  const deleteClient = useDeleteClient();

  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Client | undefined>(undefined);
  const [deleting, setDeleting] = useState<Client | null>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return clients ?? [];
    return (clients ?? []).filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        (c.phone ?? '').toLowerCase().includes(term),
    );
  }, [clients, search]);

  function openCreate() {
    setEditing(undefined);
    setFormOpen(true);
  }

  function openEdit(client: Client) {
    setEditing(client);
    setFormOpen(true);
  }

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await deleteClient.mutateAsync(deleting.id);
      toast.success('Cliente excluído');
    } catch (err) {
      const code = (err as { code?: string } | null)?.code;
      if (code === '23503') {
        toast.error('Cliente com ordens de serviço', {
          description: 'Exclua ou reatribua as OS antes de remover o cliente.',
        });
      } else {
        toast.error('Não foi possível excluir', {
          description: getErrorMessage(err),
        });
      }
      throw err; // mantém o diálogo aberto
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Clientes</h1>
          <p className="text-muted-foreground text-sm">
            Cadastro de clientes recorrentes.
          </p>
        </div>
        <Button onClick={openCreate}>
          <PlusIcon />
          Novo cliente
        </Button>
      </div>

      <Input
        placeholder="Buscar por nome ou telefone…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Carregando…</p>
      ) : isError ? (
        <p className="text-destructive text-sm">{getErrorMessage(error)}</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          {search ? 'Nenhum cliente encontrado.' : 'Nenhum cliente cadastrado.'}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead className="w-24 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>{client.phone ?? '—'}</TableCell>
                  <TableCell>{client.city ?? '—'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Editar"
                        onClick={() => openEdit(client)}
                      >
                        <PencilIcon />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Excluir"
                        onClick={() => setDeleting(client)}
                      >
                        <Trash2Icon />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ClientFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        client={editing}
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Excluir cliente"
        description={
          deleting
            ? `Remover "${deleting.name}"? Esta ação não pode ser desfeita.`
            : ''
        }
        confirmLabel="Excluir"
        destructive
        onConfirm={confirmDelete}
      />
    </div>
  );
}
