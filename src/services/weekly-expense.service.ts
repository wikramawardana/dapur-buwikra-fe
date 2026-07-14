import { apiFetch, buildQueryString } from "@/lib/api.config";
import type {
  SaveWeeklyExpensePayload,
  WeeklyExpense,
  WeeklyExpenseResponse,
} from "@/types/weekly-expense.types";

export async function getWeeklyExpense(
  weekStart: string,
): Promise<WeeklyExpenseResponse> {
  const queryString = buildQueryString({ week_start: weekStart });
  return apiFetch<WeeklyExpenseResponse>(`/weekly-expenses${queryString}`);
}

export async function saveWeeklyExpense(
  payload: SaveWeeklyExpensePayload,
): Promise<{ status: string; message: string; data: WeeklyExpense }> {
  return apiFetch<{ status: string; message: string; data: WeeklyExpense }>(
    "/weekly-expenses",
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
  );
}
