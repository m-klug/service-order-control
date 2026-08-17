import { useState } from 'react';
import { useTheme } from 'next-themes';
import { MoonIcon, SunIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Toaster } from '@/components/ui/sonner';

/**
 * Página de verificação da fundação de UI (T-02).
 * Demonstra os componentes base do shadcn/ui renderizando com o tema.
 * Será substituída pelo shell de aplicação na T-03.
 */
function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  return (
    <Button
      variant="outline"
      size="icon"
      aria-label="Alternar tema"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </Button>
  );
}

const sampleOrders = [
  {
    number: '1408a',
    client: 'Lírios do Vale',
    status: 'Aberta',
    total: 'R$ 192,00',
  },
  {
    number: '1408b',
    client: 'Ed. Central',
    status: 'Em andamento',
    total: 'R$ 340,00',
  },
  {
    number: '1508a',
    client: 'Casa Verde',
    status: 'Concluída',
    total: 'R$ 97,00',
  },
];

function App() {
  const [name, setName] = useState('');

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto max-w-3xl space-y-6 p-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">
              Controle de Ordens de Serviço
            </h1>
            <p className="text-muted-foreground text-sm">
              Verificação da fundação de UI (T-02)
            </p>
          </div>
          <ThemeToggle />
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Componentes base</CardTitle>
            <CardDescription>
              Botões, formulários, tabela, diálogo e notificações.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => toast.success('Notificação de exemplo')}>
                Mostrar toast
              </Button>
              <Button variant="secondary">Secundário</Button>
              <Button variant="outline">Contorno</Button>
              <Button variant="destructive">Destrutivo</Button>
              <Button variant="ghost">Fantasma</Button>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="name">Nome do cliente</Label>
              <Input
                id="name"
                placeholder="Ex.: Lírios do Vale"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Dialog>
              <DialogTrigger render={<Button variant="outline" />}>
                Abrir diálogo
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Diálogo de exemplo</DialogTitle>
                  <DialogDescription>
                    Confirma que os componentes de sobreposição funcionam.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    onClick={() =>
                      toast('Ação confirmada', {
                        description: name || 'sem nome',
                      })
                    }
                  >
                    Confirmar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ordens de serviço (exemplo)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sampleOrders.map((o) => (
                  <TableRow key={o.number}>
                    <TableCell className="font-medium">{o.number}</TableCell>
                    <TableCell>{o.client}</TableCell>
                    <TableCell>{o.status}</TableCell>
                    <TableCell className="text-right">{o.total}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <Toaster />
    </div>
  );
}

export default App;
