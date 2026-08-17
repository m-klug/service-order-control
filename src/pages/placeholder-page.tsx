import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type PlaceholderPageProps = {
  title: string;
  description: string;
  phase: string;
};

/** Página placeholder da Fase 0. O conteúdo real chega nas fases seguintes. */
export function PlaceholderPage({
  title,
  description,
  phase,
}: PlaceholderPageProps) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Em construção</CardTitle>
          <CardDescription>Conteúdo previsto para a {phase}.</CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          Placeholder da Fase 0 — apenas para validar navegação e layout.
        </CardContent>
      </Card>
    </div>
  );
}
