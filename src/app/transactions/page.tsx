import { TransactionsDataTable } from "@/components/transactions-data-table";

export default function TransactionsPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <TransactionsDataTable />
    </div>
  );
}
