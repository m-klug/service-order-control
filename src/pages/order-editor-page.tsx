import { useEffect, useState, type ChangeEvent } from 'react';
import {
  Controller,
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
import { CurrencyField } from '@/components/ui/currency-field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { FormField } from '@/components/form/form-field';
import { getErrorMessage } from '@/lib/errors';
import { emptyToNull } from '@/lib/form-utils';
import { formatCurrency } from '@/lib/format';
import { useClients } from '@/features/clients/queries';
import { ClientCombobox } from '@/features/clients/client-combobox';
import {
  DEFAULT_ITEM_DESCRIPTIONS,
  sortItemsForDisplay,
} from '@/features/orders/default-items';
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

// Todos os campos são opcionais (RN-05) — nada de validação de obrigatoriedade.
const tripSchema = z.object({
  date: z.string(),
  km_start: z.number().nullable(),
  km_end: z.number().nullable(),
  left_shop_at: z.string(),
  arrived_at: z.string(),
  left_client_at: z.string(),
  back_shop_at: z.string(),
  vehicle: z.string(),
  signed_by: z.string(),
});

const schema = z.object({
  number: z.string().trim().min(1, 'Informe o número'),
  client_id: z.string().uuid('Selecione o cliente'),
  opened_at: z.string().min(1, 'Informe a data'),
  status: z.enum(['open', 'in_progress', 'completed']),
  request: z.string().optional(),
  report: z.string().optional(),
  items: z.array(itemSchema),
  trips: z.array(tripSchema),
  paid: z.boolean(),
  amount_paid: z.number().nullable(),
  settled_at: z.string(),
  discount: z.number().min(0, '≥ 0'),
  warranty_months: z.number().nullable(),
});

type FormValues = z.infer<typeof schema>;
type TripFormValues = FormValues['trips'][number];

const today = () => new Date().toISOString().slice(0, 10);

const emptyTrip: TripFormValues = {
  date: '',
  km_start: null,
  km_end: null,
  left_shop_at: '',
  arrived_at: '',
  left_client_at: '',
  back_shop_at: '',
  vehicle: '',
  signed_by: '',
};

/**
 * Converte para número ou `null`. Usado como `setValueAs` em campos numéricos
 * opcionais: RHF chama isto tanto com a string do DOM (`""` quando vazio,
 * campo tocado) quanto com o valor padrão bruto de campos nunca tocados em
 * `useFieldArray` (aqui, `null` — daí tratar os dois casos; `Number(null)`
 * seria `0`, não o `null` esperado).
 */
function numberOrNull(
  value: string | number | null | undefined,
): number | null {
  if (value === '' || value === null || value === undefined) return null;
  return Number(value);
}

/** Σ(qtd × preço) − desconto (RN-03), nunca negativo. */
function calculateOrderTotal(
  items: { quantity?: number; unit_price?: number }[] | undefined,
  discount: number | undefined,
): number {
  const itemsTotal = (items ?? []).reduce((sum, item) => {
    const quantity = Number(item?.quantity) || 0;
    const price = Number(item?.unit_price) || 0;
    return sum + quantity * price;
  }, 0);
  return Math.max(0, itemsTotal - (Number(discount) || 0));
}

/** Total ao vivo, reflexo de `calculateOrderTotal`. */
function OrderTotal({ control }: { control: Control<FormValues> }) {
  const items = useWatch({ control, name: 'items' });
  const discount = useWatch({ control, name: 'discount' });
  const total = calculateOrderTotal(items, discount);
  return (
    <div className="flex items-center justify-between border-t pt-3 text-sm font-medium">
      <span>Total</span>
      <span>{formatCurrency(total)}</span>
    </div>
  );
}

function tripSummaryText(trip: Partial<TripFormValues> | undefined): string {
  if (!trip) return 'sem dados';
  const parts: string[] = [];
  if (trip.date) {
    const [y, m, d] = trip.date.split('-');
    if (y && m && d) parts.push(`${d}/${m}/${y}`);
  }
  if (
    trip.km_start != null &&
    trip.km_end != null &&
    trip.km_end >= trip.km_start
  ) {
    parts.push(`${trip.km_end - trip.km_start} km`);
  }
  return parts.length > 0 ? parts.join(' · ') : 'sem dados';
}

/** Resumo ao vivo exibido no `<summary>` do deslocamento recolhido. */
function TripSummary({
  control,
  index,
}: {
  control: Control<FormValues>;
  index: number;
}) {
  const trip = useWatch({ control, name: `trips.${index}` });
  return (
    <span className="text-muted-foreground text-sm">
      {tripSummaryText(trip)}
    </span>
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
  const [generatingPdf, setGeneratingPdf] = useState(false);

  async function handleGeneratePdf() {
    if (!order) return;
    const client = clients?.find((c) => c.id === order.client_id);
    if (!client) {
      toast.error('Cliente da OS não encontrado');
      return;
    }
    setGeneratingPdf(true);
    try {
      const { generateServiceOrderPdf } =
        await import('@/features/orders/pdf/generate-service-order-pdf');
      await generateServiceOrderPdf(order, client);
    } catch (error) {
      toast.error('Não foi possível gerar o PDF', {
        description: getErrorMessage(error),
      });
    } finally {
      setGeneratingPdf(false);
    }
  }

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    getValues,
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
      items: sortItemsForDisplay(
        DEFAULT_ITEM_DESCRIPTIONS.map((description) => ({
          description,
          quantity: 0,
          unit_price: 0,
        })),
      ),
      trips: [],
      paid: false,
      amount_paid: null,
      settled_at: '',
      discount: 0,
      warranty_months: null,
    },
  });

  const {
    fields,
    insert: insertItem,
    remove,
    replace: replaceItems,
  } = useFieldArray({ control, name: 'items', shouldUnregister: true });
  const {
    fields: tripFields,
    append: appendTrip,
    remove: removeTrip,
  } = useFieldArray({ control, name: 'trips' });

  // Índices dos deslocamentos abertos (recém-adicionados começam expandidos;
  // carregados do banco começam recolhidos). Baseado em índice: ao remover um
  // item, os índices seguintes podem abrir/fechar de forma imprecisa — efeito
  // cosmético aceitável, sem impacto nos dados.
  const [openTripIndexes, setOpenTripIndexes] = useState<Set<number>>(
    new Set(),
  );

  /** Insere antes de Mão de Obra/Deslocamento, que ficam sempre por último. */
  function handleAddItem() {
    const items = getValues('items');
    let index = items.length;
    while (
      index > 0 &&
      DEFAULT_ITEM_DESCRIPTIONS.includes(
        items[index - 1]
          .description as (typeof DEFAULT_ITEM_DESCRIPTIONS)[number],
      )
    ) {
      index--;
    }
    insertItem(index, { description: '', quantity: 1, unit_price: 0 });
  }

  function handleAddTrip() {
    const newIndex = tripFields.length;
    appendTrip(emptyTrip);
    setOpenTripIndexes((prev) => new Set(prev).add(newIndex));
  }

  function toggleTrip(index: number, open: boolean) {
    setOpenTripIndexes((prev) => {
      const next = new Set(prev);
      if (open) next.add(index);
      else next.delete(index);
      return next;
    });
  }

  // Preenche o formulário ao carregar a OS (edição).
  useEffect(() => {
    if (!order) return;
    const items = order.items.map((item) => ({
      description: item.description,
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
    }));
    reset({
      number: order.number,
      client_id: order.client_id,
      opened_at: order.opened_at,
      status: order.status,
      request: order.request ?? '',
      report: order.report ?? '',
      trips: order.trips.map((trip) => ({
        date: trip.date ?? '',
        km_start: trip.km_start,
        km_end: trip.km_end,
        left_shop_at: trip.left_shop_at ?? '',
        arrived_at: trip.arrived_at ?? '',
        left_client_at: trip.left_client_at ?? '',
        back_shop_at: trip.back_shop_at ?? '',
        vehicle: trip.vehicle ?? '',
        signed_by: trip.signed_by ?? '',
      })),
      paid: order.paid,
      amount_paid: order.amount_paid,
      settled_at: order.settled_at ?? '',
      discount: Number(order.discount),
      warranty_months: order.warranty_months,
    });
    // `items` fica de fora do reset() acima e usa `replace()` do próprio
    // `useFieldArray` (com `shouldUnregister: true` só nesse array — ver
    // sua declaração): ao encolher o array (OS sem itens, ou com menos
    // itens que os 2 padrão), o `reset()` sozinho não limpa os campos
    // `unit_price` controlados via `Controller` (CurrencyField). Sobram
    // entradas fantasma que só aparecem na validação do submit — sem erro
    // visível na tela — e em StrictMode (dev) o efeito roda em dobro,
    // tornando o problema mais fácil de reproduzir. `register`-based
    // `trips` não sofre do mesmo problema, segue resetado acima.
    replaceItems(sortItemsForDisplay(items));
    setOpenTripIndexes(new Set());
  }, [order, reset, replaceItems]);

  // Sugere o número (criação) quando ainda não preenchido.
  useEffect(() => {
    if (!isEditing && suggestedNumber) {
      setValue('number', suggestedNumber, { shouldValidate: true });
    }
  }, [isEditing, suggestedNumber, setValue]);

  // Garante o `unit_price` dos itens padrão (criação) mesmo se o efeito de
  // registro do Controller (CurrencyField) rodar em ordem diferente do
  // esperado sob StrictMode (dev): sem isto, os itens nunca tocados podem
  // chegar ao submit sem essa chave e falhar a validação (`min(0)` exige
  // number, não undefined).
  useEffect(() => {
    if (isEditing) return;
    DEFAULT_ITEM_DESCRIPTIONS.forEach((_, index) => {
      setValue(`items.${index}.unit_price`, 0);
    });
  }, [isEditing, setValue]);

  async function onSubmit(values: FormValues) {
    if (values.paid && values.amount_paid == null) {
      toast.warning('OS marcada como paga sem valor pago informado.');
    }

    const payload = {
      number: values.number.trim(),
      client_id: values.client_id,
      opened_at: values.opened_at,
      status: values.status,
      request: values.request?.trim() || null,
      report: values.report?.trim() || null,
      paid: values.paid,
      amount_paid: values.amount_paid,
      settled_at: emptyToNull(values.settled_at),
      discount: values.discount,
      warranty_months: values.warranty_months,
    };

    const items = values.items.map((item) => ({
      description: item.description.trim(),
      quantity: item.quantity,
      unit_price: item.unit_price,
    }));

    const trips = values.trips.map((trip) => ({
      date: emptyToNull(trip.date),
      km_start: trip.km_start,
      km_end: trip.km_end,
      left_shop_at: emptyToNull(trip.left_shop_at),
      arrived_at: emptyToNull(trip.arrived_at),
      left_client_at: emptyToNull(trip.left_client_at),
      back_shop_at: emptyToNull(trip.back_shop_at),
      vehicle: emptyToNull(trip.vehicle),
      signed_by: emptyToNull(trip.signed_by),
    }));

    try {
      if (id) {
        await updateOrder.mutateAsync({
          id,
          changes: payload,
          children: { items, trips },
        });
        toast.success('OS atualizada');
      } else {
        await createOrder.mutateAsync({
          input: payload,
          children: { items, trips },
        });
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
                <Controller
                  control={control}
                  name="client_id"
                  render={({ field }) => (
                    <ClientCombobox
                      id="client_id"
                      clients={clients ?? []}
                      value={field.value}
                      onValueChange={field.onChange}
                      onBlur={field.onBlur}
                    />
                  )}
                />
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
            <CardTitle>Deslocamentos</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddTrip}
            >
              <PlusIcon />
              Adicionar deslocamento
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {tripFields.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Nenhum deslocamento registrado (opcional).
              </p>
            ) : (
              tripFields.map((field, index) => (
                <details
                  key={field.id}
                  open={openTripIndexes.has(index)}
                  onToggle={(e) => toggleTrip(index, e.currentTarget.open)}
                  className="rounded-md border"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 text-sm font-medium">
                    <span>
                      Deslocamento {index + 1} ·{' '}
                      <TripSummary control={control} index={index} />
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Remover deslocamento"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        removeTrip(index);
                      }}
                    >
                      <Trash2Icon />
                    </Button>
                  </summary>
                  <div className="grid gap-4 border-t p-3 sm:grid-cols-2">
                    <FormField label="Data" htmlFor={`trip-${index}-date`}>
                      <Input
                        id={`trip-${index}-date`}
                        type="date"
                        {...register(`trips.${index}.date`)}
                      />
                    </FormField>
                    <FormField label="Carro" htmlFor={`trip-${index}-vehicle`}>
                      <Input
                        id={`trip-${index}-vehicle`}
                        {...register(`trips.${index}.vehicle`)}
                      />
                    </FormField>
                    <FormField
                      label="Km início"
                      htmlFor={`trip-${index}-km-start`}
                    >
                      <Input
                        id={`trip-${index}-km-start`}
                        type="number"
                        min="0"
                        {...register(`trips.${index}.km_start`, {
                          setValueAs: numberOrNull,
                        })}
                      />
                    </FormField>
                    <FormField label="Km fim" htmlFor={`trip-${index}-km-end`}>
                      <Input
                        id={`trip-${index}-km-end`}
                        type="number"
                        min="0"
                        {...register(`trips.${index}.km_end`, {
                          setValueAs: numberOrNull,
                        })}
                      />
                    </FormField>
                    <FormField
                      label="Saída da loja"
                      htmlFor={`trip-${index}-left-shop`}
                    >
                      <Input
                        id={`trip-${index}-left-shop`}
                        type="time"
                        {...register(`trips.${index}.left_shop_at`)}
                      />
                    </FormField>
                    <FormField
                      label="Chegada no cliente"
                      htmlFor={`trip-${index}-arrived`}
                    >
                      <Input
                        id={`trip-${index}-arrived`}
                        type="time"
                        {...register(`trips.${index}.arrived_at`)}
                      />
                    </FormField>
                    <FormField
                      label="Fim no cliente"
                      htmlFor={`trip-${index}-left-client`}
                    >
                      <Input
                        id={`trip-${index}-left-client`}
                        type="time"
                        {...register(`trips.${index}.left_client_at`)}
                      />
                    </FormField>
                    <FormField
                      label="Retorno à loja"
                      htmlFor={`trip-${index}-back-shop`}
                    >
                      <Input
                        id={`trip-${index}-back-shop`}
                        type="time"
                        {...register(`trips.${index}.back_shop_at`)}
                      />
                    </FormField>
                    <FormField label="Visto" htmlFor={`trip-${index}-signed`}>
                      <Input
                        id={`trip-${index}-signed`}
                        {...register(`trips.${index}.signed_by`)}
                      />
                    </FormField>
                  </div>
                </details>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Itens</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddItem}
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
                <div
                  key={field.id}
                  className="flex flex-col gap-2 border-b pb-3 last:border-b-0 last:pb-0 sm:flex-row sm:items-start sm:border-0 sm:pb-0"
                >
                  <FormField
                    className="w-full sm:flex-1"
                    error={errors.items?.[index]?.description?.message}
                  >
                    <Input
                      placeholder="Descrição"
                      aria-label="Descrição"
                      {...register(`items.${index}.description`)}
                    />
                  </FormField>
                  <div className="flex items-start gap-2">
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
                      <Controller
                        control={control}
                        name={`items.${index}.unit_price`}
                        render={({ field }) => (
                          <CurrencyField
                            aria-label="Preço unitário"
                            value={field.value}
                            onValueChange={(value) =>
                              field.onChange(value ?? 0)
                            }
                            onBlur={field.onBlur}
                          />
                        )}
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
                </div>
              ))
            )}
            <OrderTotal control={control} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pagamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                id="paid"
                type="checkbox"
                className="border-input accent-foreground h-4 w-4 rounded"
                {...register('paid', {
                  onChange: (event: ChangeEvent<HTMLInputElement>) => {
                    if (!event.target.checked) return;
                    if (getValues('amount_paid') != null) return;
                    const total = calculateOrderTotal(
                      getValues('items'),
                      getValues('discount'),
                    );
                    if (total > 0) setValue('amount_paid', total);
                  },
                })}
              />
              <Label htmlFor="paid">Pago</Label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="Valor pago"
                htmlFor="amount_paid"
                error={errors.amount_paid?.message}
              >
                <Controller
                  control={control}
                  name="amount_paid"
                  render={({ field }) => (
                    <CurrencyField
                      id="amount_paid"
                      value={field.value}
                      onValueChange={field.onChange}
                      onBlur={field.onBlur}
                    />
                  )}
                />
              </FormField>
              <FormField label="Data de quitação" htmlFor="settled_at">
                <Input
                  id="settled_at"
                  type="date"
                  {...register('settled_at')}
                />
              </FormField>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="Desconto"
                htmlFor="discount"
                error={errors.discount?.message}
              >
                <Controller
                  control={control}
                  name="discount"
                  render={({ field }) => (
                    <CurrencyField
                      id="discount"
                      value={field.value}
                      onValueChange={(value) => field.onChange(value ?? 0)}
                      onBlur={field.onBlur}
                    />
                  )}
                />
              </FormField>
              <FormField label="Garantia (meses)" htmlFor="warranty_months">
                <Input
                  id="warranty_months"
                  type="number"
                  step="1"
                  min="0"
                  {...register('warranty_months', { setValueAs: numberOrNull })}
                />
              </FormField>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          {isEditing ? (
            <Button
              type="button"
              variant="outline"
              disabled={generatingPdf}
              onClick={handleGeneratePdf}
            >
              {generatingPdf ? 'Gerando…' : 'Gerar PDF'}
            </Button>
          ) : null}
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
