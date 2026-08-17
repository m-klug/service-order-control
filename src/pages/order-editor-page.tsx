import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/form/form-field';
import { getErrorMessage } from '@/lib/errors';
import { useClients } from '@/features/clients/queries';
import {
  useCreateServiceOrder,
  useServiceOrder,
  useSuggestedOrderNumber,
  useUpdateServiceOrder,
} from '@/features/orders/queries';

const statusOptions = [
  { value: 'open', label: 'Aberta' },
  { value: 'in_progress', label: 'Em andamento' },
  { value: 'completed', label: 'Concluída' },
] as const;

const schema = z.object({
  number: z.string().trim().min(1, 'Informe o número'),
  client_id: z.string().uuid('Selecione o cliente'),
  opened_at: z.string().min(1, 'Informe a data'),
  status: z.enum(['open', 'in_progress', 'completed']),
  request: z.string().optional(),
  report: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const today = () => new Date().toISOString().slice(0, 10);

export function OrderEditorPage() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const { data: clients } = useClients();
  const { data: order, isLoading: loadingOrder } = useServiceOrder(id);
  const { data: suggestedNumber } = useSuggestedOrderNumber(!isEditing);
  const createOrder = useCreateServiceOrder();
  const updateOrder = useUpdateServiceOrder();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      number: '',
      client_id: '',
      opened_at: today(),
      status: 'open',
      request: '',
      report: '',
    },
  });

  // Preenche o formulário ao carregar a OS (edição).
  useEffect(() => {
    if (!order) return;
    reset({
      number: order.number,
      client_id: order.client_id,
      opened_at: order.opened_at,
      status: order.status,
      request: order.request ?? '',
      report: order.report ?? '',
    });
  }, [order, reset]);

  // Sugere o número (criação) quando ainda não preenchido.
  useEffect(() => {
    if (!isEditing && suggestedNumber) {
      setValue('number', suggestedNumber, { shouldValidate: true });
    }
  }, [isEditing, suggestedNumber, setValue]);

  async function onSubmit(values: FormValues) {
    const payload = {
      number: values.number.trim(),
      client_id: values.client_id,
      opened_at: values.opened_at,
      status: values.status,
      request: values.request?.trim() || null,
      report: values.report?.trim() || null,
    };

    try {
      if (id) {
        await updateOrder.mutateAsync({ id, changes: payload });
        toast.success('OS atualizada');
      } else {
        await createOrder.mutateAsync({ input: payload, items: [] });
        toast.success('OS criada');
      }
      navigate('/ordens');
    } catch (error) {
      const code = (error as { code?: string } | null)?.code;
      toast.error('Não foi possível salvar', {
        description:
          code === '23505'
            ? 'Já existe uma OS com esse número.'
            : getErrorMessage(error),
      });
    }
  }

  if (isEditing && loadingOrder) {
    return <p className="text-muted-foreground text-sm">Carregando…</p>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">
          {isEditing ? `OS ${order?.number ?? ''}` : 'Nova ordem de serviço'}
        </h1>
        <p className="text-muted-foreground text-sm">
          Dados da ordem de serviço.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Card>
          <CardHeader>
            <CardTitle>Cabeçalho</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="Número"
                htmlFor="number"
                error={errors.number?.message}
              >
                <Input id="number" {...register('number')} />
              </FormField>
              <FormField
                label="Data de abertura"
                htmlFor="opened_at"
                error={errors.opened_at?.message}
              >
                <Input id="opened_at" type="date" {...register('opened_at')} />
              </FormField>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="Cliente"
                htmlFor="client_id"
                error={errors.client_id?.message}
              >
                <select
                  id="client_id"
                  className="border-input bg-transparent dark:bg-input/30 h-8 w-full rounded-lg border px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3"
                  {...register('client_id')}
                >
                  <option value="">Selecione…</option>
                  {(clients ?? []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Status" htmlFor="status">
                <select
                  id="status"
                  className="border-input bg-transparent dark:bg-input/30 h-8 w-full rounded-lg border px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3"
                  {...register('status')}
                >
                  {statusOptions.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            <FormField label="Solicitação" htmlFor="request">
              <Textarea id="request" rows={2} {...register('request')} />
            </FormField>
            <FormField label="Relatório" htmlFor="report">
              <Textarea id="report" rows={3} {...register('report')} />
            </FormField>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/ordens')}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando…' : 'Salvar'}
          </Button>
        </div>
      </form>
    </div>
  );
}
