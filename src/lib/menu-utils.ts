const INDONESIAN_MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
] as const;

export function generateWeeklyMenuTitle(
  startDate?: Date,
  endDate?: Date,
): string {
  if (!startDate || !endDate) return "";

  const startDay = startDate.getDate();
  const endDay = endDate.getDate();
  const startMonth = INDONESIAN_MONTHS[startDate.getMonth()];
  const endMonth = INDONESIAN_MONTHS[endDate.getMonth()];
  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();

  let range: string;
  if (startYear === endYear && startDate.getMonth() === endDate.getMonth()) {
    range = `${startDay}–${endDay} ${endMonth} ${endYear}`;
  } else if (startYear === endYear) {
    range = `${startDay} ${startMonth}–${endDay} ${endMonth} ${endYear}`;
  } else {
    range = `${startDay} ${startMonth} ${startYear}–${endDay} ${endMonth} ${endYear}`;
  }

  return `Menu Mingguan · ${range}`;
}

export function getPortfolioDateValue(
  portfolioDate?: string | null,
): Date | undefined {
  return portfolioDate ? new Date(`${portfolioDate}T00:00:00`) : undefined;
}

export function getPortfolioSortTime(
  portfolioDate?: string | null,
): number | null {
  return getPortfolioDateValue(portfolioDate)?.getTime() ?? null;
}

export function formatPortfolioDate(portfolioDate?: string | null): string {
  const date = getPortfolioDateValue(portfolioDate);
  if (!date) return "Tanggal belum diatur";

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}
