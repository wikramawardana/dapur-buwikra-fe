import { apiFetch, buildQueryString } from "@/lib/api.config";
import type {
  WeeklyExpense,
  WeeklyExpensePayload,
  WeeklyExpenseResponse,
  WeeklyExpensesResponse,
} from "@/types/weekly-expense.types";

export async function getWeeklyExpenses(
  weekStart?: string,
): Promise<WeeklyExpensesResponse> {
  const queryString = buildQueryString({ week_start: weekStart });
  return apiFetch<WeeklyExpensesResponse>(`/weekly-expenses${queryString}`);
}

export async function createWeeklyExpense(
  payload: WeeklyExpensePayload,
): Promise<{ status: string; message: string; data: WeeklyExpense }> {
  return apiFetch<{ status: string; message: string; data: WeeklyExpense }>(
    "/weekly-expenses",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export async function updateWeeklyExpense(
  id: string,
  payload: WeeklyExpensePayload,
): Promise<WeeklyExpenseResponse> {
  return apiFetch<WeeklyExpenseResponse>(`/weekly-expenses/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteWeeklyExpense(
  id: string,
): Promise<{ status: string; message: string }> {
  return apiFetch<{ status: string; message: string }>(
    `/weekly-expenses/${id}`,
    { method: "DELETE" },
  );
}
