import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/form/form-field';
import { getErrorMessage } from '@/lib/errors';
import { emptyToNull } from '@/lib/form-utils';
import type { Client, NewClient } from '@/lib/repositories';
import { useCreateClient, useUpdateClient } from './queries';

const schema = z.object({
  name: z.string().trim().min(1, 'Informe o nome'),
  phone: z.string().trim().optional(),
  email: z
    .union([z.literal(''), z.string().email('E-mail inválido')])
    .optional(),
  city: z.string().trim().optional(),
  address: z.string().trim().optional(),
  district: z.string().trim().optional(),
  reference: z.string().trim().optional(),
});

type FormValues = z.infer<typeof schema>;

const emptyDefaults: FormValues = {
  name: '',
  phone: '',
  email: '',
  city: 'Timbó',
  address: '',
  district: '',
  reference: '',
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Presente = edição; ausente = criação. */
  client?: Client;
};

export function ClientFormDialog({ open, onOpenChange, client }: Props) {
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const isEditing = Boolean(client);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyDefaults,
  });

  useEffect(() => {
    if (!open) return;
    reset(
      client
        ? {
            name: client.name,
            phone: client.phone ?? '',
            email: client.email ?? '',
            city: client.city ?? 'Timbó',
            address: client.address ?? '',
            district: client.district ?? '',
            reference: client.reference ?? '',
          }
        : emptyDefaults,
    );
  }, [open, client, reset]);

  async function onSubmit(values: FormValues) {
    const payload: NewClient = {
      name: values.name.trim(),
      phone: emptyToNull(values.phone),
      email: emptyToNull(values.email),
      city: emptyToNull(values.city) ?? 'Timbó',
      address: emptyToNull(values.address),
      district: emptyToNull(values.district),
      reference: emptyToNull(values.reference),
    };

    try {
      if (client) {
        await updateClient.mutateAsync({ id: client.id, changes: payload });
        toast.success('Cliente atualizado');
      } else {
        await createClient.mutateAsync(payload);
        toast.success('Cliente criado');
      }
      onOpenChange(false);
    } catch (error) {
      toast.error('Não foi possível salvar', {
        description: getErrorMessage(error),
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar cliente' : 'Novo cliente'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Atualize os dados do cliente.'
              : 'Cadastre um cliente para reutilizar nas ordens.'}
          </DialogDescription>
        </DialogHeader>

        <form
          id="client-form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <FormField label="Nome" htmlFor="name" error={errors.name?.message}>
            <Input id="name" {...register('name')} />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Telefone" htmlFor="phone">
              <Input id="phone" {...register('phone')} />
            </FormField>
            <FormField
              label="E-mail"
              htmlFor="email"
              error={errors.email?.message}
            >
              <Input id="email" type="email" {...register('email')} />
            </FormField>
          </div>
          <FormField label="Endereço" htmlFor="address">
            <Input id="address" {...register('address')} />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Bairro" htmlFor="district">
              <Input id="district" {...register('district')} />
            </FormField>
            <FormField label="Cidade" htmlFor="city">
              <Input id="city" {...register('city')} />
            </FormField>
          </div>
          <FormField label="Referência" htmlFor="reference">
            <Input id="reference" {...register('reference')} />
          </FormField>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button type="submit" form="client-form" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando…' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
