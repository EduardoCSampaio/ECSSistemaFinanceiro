'use client';

import { SummaryCards } from '@/components/dashboard/summary-cards';
import { OverviewChart } from '@/components/dashboard/overview-chart';
import { RecentTransactions } from '@/components/dashboard/recent-transactions';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
       <div className="flex flex-1 flex-col gap-4 md:gap-8">
          <div className="flex items-center">
            <h1 className="text-lg font-semibold md:text-2xl">Dashboard</h1>
          </div>
          <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
          <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
            <Skeleton className="h-80 xl:col-span-2" />
            <Skeleton className="h-80" />
          </div>
      </div>
    )
  }

  if (!user) {
    // This case should be handled by the root layout, but as a fallback:
    return <p>Por favor, faça login para ver o dashboard.</p>;
  }

  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Dashboard</h1>
      </div>
      <SummaryCards userId={user.uid} />
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <OverviewChart userId={user.uid} />
        <RecentTransactions userId={user.uid} />
      </div>
    </div>
  );
}
