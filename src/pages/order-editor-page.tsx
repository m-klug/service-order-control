import { useEffect } from 'react';
import {
  useFieldArray,
  useForm,
  useWatch,
  type Control,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { PlusIcon, Trash2Icon } from 'lucide-react';
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

const itemSchema = z.object({
  description: z.string().trim().min(1, 'Descrição'),
  quantity: z.number({ message: 'Qtd' }).min(0, '≥ 0'),
  unit_price: z.number({ message: 'Preço' }).min(0, '≥ 0'),
});

const schema = z.object({
  number: z.string().trim().min(1, 'Informe o número'),
  client_id: z.string().uuid('Selecione o cliente'),
  opened_at: z.string().min(1, 'Informe a data'),
  status: z.enum(['open', 'in_progress', 'completed']),
  request: z.string().optional(),
  report: z.string().optional(),
  items: z.array(itemSchema),
});

type FormValues = z.infer<typeof schema>;

const today = () => new Date().toISOString().slice(0, 10);

const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

/** Total ao vivo: Σ(qtd × preço) − desconto (0 nesta fase), nunca negativo. */
function OrderTotal({ control }: { control: Control<FormValues> }) {
  const items = useWatch({ control, name: 'items' });
  const total = (items ?? []).reduce((sum, item) => {
    const quantity = Number(item?.quantity) || 0;
    const price = Number(item?.unit_price) || 0;
    return sum + quantity * price;
  }, 0);
  return (
    <div className="flex items-center justify-between border-t pt-3 text-sm font-medium">
      <span>Total</span>
      <span>{brl.format(Math.max(0, total))}</span>
    </div>
  );
}

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
    control,
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
      items: [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

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
      items: order.items.map((item) => ({
        description: item.description,
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
      })),
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

    const items = values.items.map((item) => ({
      description: item.description.trim(),
      quantity: item.quantity,
      unit_price: item.unit_price,
    }));

    try {
      if (id) {
        await updateOrder.mutateAsync({ id, changes: payload, items });
        toast.success('OS atualizada');
      } else {
        await createOrder.mutateAsync({ input: payload, items });
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

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Itens</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({ description: '', quantity: 1, unit_price: 0 })
              }
            >
              <PlusIcon />
              Adicionar item
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {fields.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Nenhum item. Adicione mão de obra, deslocamento, peças, etc.
              </p>
            ) : (
              fields.map((field, index) => (
                <div key={field.id} className="flex items-start gap-2">
                  <FormField
                    className="flex-1"
                    error={errors.items?.[index]?.description?.message}
                  >
                    <Input
                      placeholder="Descrição"
                      aria-label="Descrição"
                      {...register(`items.${index}.description`)}
                    />
                  </FormField>
                  <FormField
                    className="w-20"
                    error={errors.items?.[index]?.quantity?.message}
                  >
                    <Input
                      type="number"
                      step="1"
                      min="0"
                      aria-label="Quantidade"
                      {...register(`items.${index}.quantity`, {
                        valueAsNumber: true,
                      })}
                    />
                  </FormField>
                  <FormField
                    className="w-28"
                    error={errors.items?.[index]?.unit_price?.message}
                  >
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      aria-label="Preço unitário"
                      {...register(`items.${index}.unit_price`, {
                        valueAsNumber: true,
                      })}
                    />
                  </FormField>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Remover item"
                    onClick={() => remove(index)}
                  >
                    <Trash2Icon />
                  </Button>
                </div>
              ))
            )}
            <OrderTotal control={control} />
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
