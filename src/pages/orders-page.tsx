import { Link } from 'react-router-dom';
import { PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function OrdersPage() {
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

      <p className="text-muted-foreground text-sm">
        A listagem de ordens entra na F1-06.
      </p>
    </div>
  );
}
