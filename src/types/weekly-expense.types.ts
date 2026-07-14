export interface WeeklyExpense {
  id: string;
  week_start: string;
  week_end: string;
  amount: number;
  note?: string | null;
  created_at: string;
  updated_at: string;
}

export interface WeeklyExpensesResponse {
  status: string;
  message: string;
  data: WeeklyExpense[];
}

export interface WeeklyExpenseResponse {
  status: string;
  message: string;
  data: WeeklyExpense;
}

export interface WeeklyExpensePayload {
  week_start: string;
  week_end: string;
  amount: number;
  note?: string;
}
