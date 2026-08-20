import { useState } from 'react';
import { Combobox } from '@base-ui/react/combobox';
import { PlusIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Client } from '@/lib/repositories';
import { ClientFormDialog } from './client-form-dialog';

type Props = {
  id?: string;
  clients: Client[];
  value: string;
  onValueChange: (clientId: string) => void;
  onBlur?: () => void;
};

/**
 * Campo de cliente com busca (filtragem local, acento/caixa insensível via
 * `Intl.Collator`) e criação na hora quando a busca não encontra nada.
 */
export function ClientCombobox({
  id,
  clients,
  value,
  onValueChange,
  onBlur,
}: Props) {
  const [query, setQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  // Nome capturado no clique de "Criar cliente": ao fechar o popup sem uma
  // seleção correspondente, o Combobox reverte o texto digitado de volta
  // para o cliente já selecionado — `query` sozinho não sobreviveria a isso.
  const [createName, setCreateName] = useState('');
  const selected = clients.find((c) => c.id === value) ?? null;

  function handleCreateClick() {
    setCreateName(query);
    setDialogOpen(true);
  }

  return (
    <>
      <Combobox.Root
        items={clients}
        value={selected}
        onValueChange={(client) => onValueChange(client?.id ?? '')}
        itemToStringLabel={(c: Client) => c.name}
        onInputValueChange={setQuery}
      >
        <Combobox.Input
          id={id}
          onBlur={onBlur}
          placeholder="Buscar cliente…"
          className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
        />
        <Combobox.Portal>
          <Combobox.Positioner
            side="bottom"
            sideOffset={4}
            className="isolate z-50"
          >
            <Combobox.Popup className="max-h-(--available-height) w-(--anchor-width) origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
              <Combobox.Empty className="p-1">
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleCreateClick}
                  className="flex w-full items-center gap-1.5 rounded-md px-1.5 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                >
                  <PlusIcon className="size-4 shrink-0" />
                  Criar cliente{query ? ` "${query}"` : ''}
                </button>
              </Combobox.Empty>
              <Combobox.List>
                {(client: Client) => (
                  <Combobox.Item
                    key={client.id}
                    value={client}
                    className={cn(
                      'relative flex w-full cursor-default items-center gap-1.5 rounded-md px-1.5 py-1 text-sm outline-hidden select-none',
                      'data-highlighted:bg-accent data-highlighted:text-accent-foreground',
                    )}
                  >
                    {client.name}
                  </Combobox.Item>
                )}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
      <ClientFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialName={createName}
        onCreated={(client) => onValueChange(client.id)}
      />
    </>
  );
}
