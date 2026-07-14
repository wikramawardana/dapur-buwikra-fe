export interface WeeklyExpense {
  id: string;
  week_start: string;
  week_end: string;
  amount: number;
  note?: string | null;
  created_at: string;
  updated_at: string;
}

export interface WeeklyExpenseResponse {
  status: string;
  message: string;
  data: WeeklyExpense | null;
}

export interface SaveWeeklyExpensePayload {
  week_start: string;
  week_end: string;
  amount: number;
  note?: string;
}
