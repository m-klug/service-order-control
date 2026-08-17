import { ClipboardList, Users, Wallet, type LucideIcon } from 'lucide-react';

export type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
};

/** Itens de navegação compartilhados entre a sidebar (desktop) e a barra inferior (mobile). */
export const navItems: NavItem[] = [
  { to: '/ordens', label: 'Ordens', icon: ClipboardList },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/financeiro', label: 'Financeiro', icon: Wallet },
];
