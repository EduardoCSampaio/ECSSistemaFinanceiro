import { SummaryCards } from '@/components/dashboard/summary-cards';
import { OverviewChart } from '@/components/dashboard/overview-chart';
import { RecentTransactions } from '@/components/dashboard/recent-transactions';

export default function DashboardPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Dashboard</h1>
      </div>
      <SummaryCards />
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <OverviewChart />
        <RecentTransactions />
      </div>
    </div>
  );
}
