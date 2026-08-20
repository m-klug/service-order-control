import * as React from 'react';
import { NumberField } from '@base-ui/react/number-field';

import { cn } from '@/lib/utils';

type CurrencyFieldProps = Omit<
  React.ComponentProps<typeof NumberField.Input>,
  'value' | 'onChange' | 'defaultValue'
> & {
  value: number | null;
  onValueChange: (value: number | null) => void;
};

/**
 * Campo monetário em pt-BR (`R$` + vírgula decimal), sem os botões de
 * incremento/decremento — só o formato, não o comportamento de stepper.
 */
function CurrencyField({
  id,
  value,
  onValueChange,
  className,
  ...props
}: CurrencyFieldProps) {
  return (
    <NumberField.Root
      id={id}
      value={value}
      onValueChange={onValueChange}
      format={{ style: 'currency', currency: 'BRL' }}
      locale="pt-BR"
    >
      <NumberField.Input
        data-slot="currency-field"
        className={cn(
          'h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40',
          className,
        )}
        {...props}
      />
    </NumberField.Root>
  );
}

export { CurrencyField };
