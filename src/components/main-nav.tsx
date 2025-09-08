'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Wallet,
  Landmark,
  FileText,
  PieChart,
  TrendingUp,
  CalendarClock,
  Repeat,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transações', icon: Wallet },
  { href: '/accounts', label: 'Contas', icon: Landmark },
  { href: '/budgets', label: 'Orçamentos', icon: PieChart },
  { href: '/recurring-expenses', label: 'Despesas Recorrentes', icon: CalendarClock },
  { href: '/recurring-incomes', label: 'Receitas Recorrentes', icon: Repeat },
  { href: '/reports', label: 'Relatórios', icon: FileText },
  { href: '/projections', label: 'Projeções', icon: TrendingUp },
];

export function MainNav({ isMobile = false }: { isMobile?: boolean }) {
  const pathname = usePathname();

  const renderLink = (item: NavItem) => (
    <Link
      key={item.href}
      href={item.href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
        pathname === item.href && 'bg-muted text-primary',
        isMobile && 'text-lg'
      )}
    >
      <item.icon className="h-4 w-4" />
      {item.label}
    </Link>
  );

  return (
    <TooltipProvider>
      <nav className="grid items-start gap-2 px-2 text-sm font-medium lg:px-4">
        {navItems.map(item =>
          isMobile ? (
            renderLink(item)
          ) : (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>
                {renderLink(item)}
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{item.label}</p>
              </TooltipContent>
            </Tooltip>
          )
        )}
      </nav>
    </TooltipProvider>
  );
}
