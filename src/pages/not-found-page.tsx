import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <p className="text-4xl font-semibold">404</p>
      <p className="text-muted-foreground">Página não encontrada.</p>
      <Button render={<Link to="/ordens" />}>Ir para Ordens</Button>
    </div>
  );
}
