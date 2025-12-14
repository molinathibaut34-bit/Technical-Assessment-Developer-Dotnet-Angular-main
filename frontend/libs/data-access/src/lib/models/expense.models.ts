export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  category?: string;
  userId: string;
  userName: string;
  billingCompany?: string;
  billingStreet?: string;
  billingPostalCode?: string;
  billingCity?: string;
}

export interface CreateExpenseRequest {
  description: string;
  amount: number;
  date: string;
  category?: string;
  userId: string;
  billingCompany?: string;
  billingStreet?: string;
  billingPostalCode?: string;
  billingCity?: string;
}

export interface ExpenseReport {
  userId: string;
  userName: string;
  year: number;
  month: number;
  periodStart: string;
  periodEnd: string;
  totalAmount: number;
  expenseCount: number;
  expenses: Expense[];
}

