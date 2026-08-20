import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { formatCurrency, formatDate } from '@/lib/format';
import { DEFAULT_ITEM_DESCRIPTIONS } from '@/features/orders/default-items';
import { LogoMark } from './logo-mark';
import type {
  Client,
  ServiceOrderWithChildren,
} from '@/lib/repositories/types';

/** Item padrão (Deslocamento/Mão de Obra) não usado — some do documento entregue ao cliente. */
function isUnusedDefaultItem(item: {
  description: string;
  quantity: number | string;
}) {
  return (
    Number(item.quantity) === 0 &&
    DEFAULT_ITEM_DESCRIPTIONS.includes(
      item.description as (typeof DEFAULT_ITEM_DESCRIPTIONS)[number],
    )
  );
}

const statusLabels: Record<string, string> = {
  open: 'Aberta',
  in_progress: 'Em andamento',
  completed: 'Concluída',
};

const styles = StyleSheet.create({
  page: { padding: 28, fontSize: 10, fontFamily: 'Helvetica' },
  title: { fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
  subtitle: { fontSize: 9, color: '#555', marginBottom: 12 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  section: { marginBottom: 12 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 4,
    borderBottom: '1 solid #ccc',
    paddingBottom: 2,
  },
  row: { flexDirection: 'row', marginBottom: 2 },
  label: { color: '#555', width: 90 },
  value: { flex: 1 },
  table: { display: 'flex', width: '100%' },
  tableHeader: {
    flexDirection: 'row',
    borderBottom: '1 solid #333',
    paddingBottom: 3,
    marginBottom: 3,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #eee',
    paddingVertical: 2,
  },
  colDescription: { flex: 3 },
  colSmall: { flex: 1, textAlign: 'right' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 6,
    gap: 8,
  },
  totalLabel: { fontWeight: 'bold' },
});

export function ServiceOrderPdfDocument({
  order,
  client,
}: {
  order: ServiceOrderWithChildren;
  client: Client;
}) {
  const itemsTotal = order.items.reduce(
    (sum, item) => sum + Number(item.quantity) * Number(item.unit_price),
    0,
  );
  const total = Math.max(0, itemsTotal - Number(order.discount));

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <LogoMark size={32} />
            <View>
              <Text style={styles.title}>Beto Sistemas de Segurança</Text>
              <Text style={styles.subtitle}>Ordem de Serviço</Text>
            </View>
          </View>
          <View>
            <Text>Número: {order.number}</Text>
            <Text>Data: {formatDate(order.opened_at)}</Text>
            <Text>Status: {statusLabels[order.status] ?? order.status}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cliente</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nome</Text>
            <Text style={styles.value}>{client.name}</Text>
          </View>
          {client.address ? (
            <View style={styles.row}>
              <Text style={styles.label}>Endereço</Text>
              <Text style={styles.value}>{client.address}</Text>
            </View>
          ) : null}
          {client.district ? (
            <View style={styles.row}>
              <Text style={styles.label}>Bairro</Text>
              <Text style={styles.value}>{client.district}</Text>
            </View>
          ) : null}
          {client.reference ? (
            <View style={styles.row}>
              <Text style={styles.label}>Referência</Text>
              <Text style={styles.value}>{client.reference}</Text>
            </View>
          ) : null}
          {client.city ? (
            <View style={styles.row}>
              <Text style={styles.label}>Cidade</Text>
              <Text style={styles.value}>{client.city}</Text>
            </View>
          ) : null}
          {client.phone ? (
            <View style={styles.row}>
              <Text style={styles.label}>Telefone</Text>
              <Text style={styles.value}>{client.phone}</Text>
            </View>
          ) : null}
        </View>

        {order.request ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Solicitação</Text>
            <Text>{order.request}</Text>
          </View>
        ) : null}

        {order.trips.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Deslocamentos</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.colDescription}>Data / Carro</Text>
                <Text style={styles.colSmall}>Km início</Text>
                <Text style={styles.colSmall}>Km fim</Text>
                <Text style={styles.colSmall}>Saída loja</Text>
                <Text style={styles.colSmall}>Chegada cliente</Text>
                <Text style={styles.colSmall}>Fim cliente</Text>
                <Text style={styles.colSmall}>Retorno loja</Text>
              </View>
              {order.trips.map((trip) => (
                <View style={styles.tableRow} key={trip.id}>
                  <Text style={styles.colDescription}>
                    {[formatDate(trip.date), trip.vehicle]
                      .filter(Boolean)
                      .join(' · ') || '—'}
                  </Text>
                  <Text style={styles.colSmall}>{trip.km_start ?? '—'}</Text>
                  <Text style={styles.colSmall}>{trip.km_end ?? '—'}</Text>
                  <Text style={styles.colSmall}>
                    {trip.left_shop_at ?? '—'}
                  </Text>
                  <Text style={styles.colSmall}>{trip.arrived_at ?? '—'}</Text>
                  <Text style={styles.colSmall}>
                    {trip.left_client_at ?? '—'}
                  </Text>
                  <Text style={styles.colSmall}>
                    {trip.back_shop_at ?? '—'}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Itens</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.colDescription}>Descrição</Text>
              <Text style={styles.colSmall}>Qtd</Text>
              <Text style={styles.colSmall}>Preço unit.</Text>
              <Text style={styles.colSmall}>Subtotal</Text>
            </View>
            {order.items
              .filter((item) => !isUnusedDefaultItem(item))
              .map((item) => (
                <View style={styles.tableRow} key={item.id}>
                  <Text style={styles.colDescription}>{item.description}</Text>
                  <Text style={styles.colSmall}>{Number(item.quantity)}</Text>
                  <Text style={styles.colSmall}>
                    {formatCurrency(Number(item.unit_price))}
                  </Text>
                  <Text style={styles.colSmall}>
                    {formatCurrency(
                      Number(item.quantity) * Number(item.unit_price),
                    )}
                  </Text>
                </View>
              ))}
          </View>
          {order.discount > 0 ? (
            <View style={styles.totalRow}>
              <Text>Desconto</Text>
              <Text>{formatCurrency(Number(order.discount))}</Text>
            </View>
          ) : null}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalLabel}>{formatCurrency(total)}</Text>
          </View>
        </View>

        {order.report ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Relatório</Text>
            <Text>{order.report}</Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pagamento e Garantia</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Situação</Text>
            <Text style={styles.value}>{order.paid ? 'Pago' : 'Não pago'}</Text>
          </View>
          {order.paid && order.amount_paid != null ? (
            <View style={styles.row}>
              <Text style={styles.label}>Valor pago</Text>
              <Text style={styles.value}>
                {formatCurrency(Number(order.amount_paid))}
              </Text>
            </View>
          ) : null}
          {order.paid && order.settled_at ? (
            <View style={styles.row}>
              <Text style={styles.label}>Data de quitação</Text>
              <Text style={styles.value}>{formatDate(order.settled_at)}</Text>
            </View>
          ) : null}
          {order.warranty_months != null ? (
            <View style={styles.row}>
              <Text style={styles.label}>Garantia</Text>
              <Text style={styles.value}>
                {order.warranty_months}{' '}
                {order.warranty_months === 1 ? 'mês' : 'meses'}
              </Text>
            </View>
          ) : null}
        </View>
      </Page>
    </Document>
  );
}
