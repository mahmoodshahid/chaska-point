export interface ExpenseItem {
  id: string;
  name: string;
  isSelected: boolean;
  amount: number;
}

export interface DailyReport {
  id: string; // Unique ID (e.g. report date)
  date: string; // YYYY-MM-DD
  sale1: number;
  sale2: number;
  totalSale: number;
  expenses: { name: string; amount: number }[];
  totalExpense: number;
  profit: number; // can be negative for loss
  notes?: string;
}
