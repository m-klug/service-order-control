import { pdf } from '@react-pdf/renderer';
import type {
  Client,
  ServiceOrderWithChildren,
} from '@/lib/repositories/types';
import { ServiceOrderPdfDocument } from './service-order-pdf';

/**
 * Gera o PDF da OS e baixa direto (sem servidor — RNF-01/RNF-03).
 * `window.open` com URL de blob costuma ser bloqueado como pop-up quando
 * chamado após um `await` (perde o gesto do usuário); link com `download`
 * não sofre esse bloqueio.
 */
export async function generateServiceOrderPdf(
  order: ServiceOrderWithChildren,
  client: Client,
): Promise<void> {
  const blob = await pdf(
    <ServiceOrderPdfDocument order={order} client={client} />,
  ).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `OS-${order.number}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
