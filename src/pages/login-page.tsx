import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FormField } from '@/components/form/form-field';
import { useAuth } from '@/lib/auth-context';

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Informe a senha'),
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const { session, loading, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from =
    (location.state as { from?: { pathname: string } } | null)?.from
      ?.pathname ?? '/ordens';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  if (!loading && session) {
    return <Navigate to={from} replace />;
  }

  async function onSubmit(values: FormValues) {
    try {
      await signIn(values.email, values.password);
      navigate(from, { replace: true });
    } catch (error) {
      toast.error('Falha no login', {
        description:
          error instanceof Error
            ? error.message
            : 'Verifique suas credenciais.',
      });
    }
  }

  return (
    <div className="bg-background flex min-h-dvh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Entrar</CardTitle>
          <CardDescription>Controle de Ordens de Serviço</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
            noValidate
          >
            <FormField
              label="E-mail"
              htmlFor="email"
              error={errors.email?.message}
            >
              <Input
                id="email"
                type="email"
                autoComplete="email"
                {...register('email')}
              />
            </FormField>
            <FormField
              label="Senha"
              htmlFor="password"
              error={errors.password?.message}
            >
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register('password')}
              />
            </FormField>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Entrando…' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
