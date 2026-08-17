import type { ReactNode } from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type FormFieldProps = {
  /** Texto do rótulo. */
  label?: ReactNode;
  /** `id` do controle associado ao rótulo. */
  htmlFor?: string;
  /** Mensagem de erro do campo (react-hook-form). */
  error?: string;
  /** Dica opcional abaixo do controle. */
  hint?: ReactNode;
  className?: string;
  children: ReactNode;
};

/**
 * Campo de formulário padrão: rótulo + controle + erro/dica.
 * Usar com react-hook-form (`register`/`Controller`) e os inputs do shadcn.
 */
export function FormField({
  label,
  htmlFor,
  error,
  hint,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={cn('grid gap-2', className)}>
      {label && <Label htmlFor={htmlFor}>{label}</Label>}
      {children}
      {error ? (
        <p className="text-destructive text-sm">{error}</p>
      ) : hint ? (
        <p className="text-muted-foreground text-sm">{hint}</p>
      ) : null}
    </div>
  );
}
