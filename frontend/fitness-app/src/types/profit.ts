interface ProfitDay {
  date: string;     // YYYY-MM-DD
  profit: number;
}

export interface ProfitWeekOut {
  profit_week: ProfitDay[];
}

export interface ProfitMonthOut {
  profit_month: ProfitDay[];
}

type YearMonth = `${number}-${number}`;

interface ProfitMonth {
  month: YearMonth; // formato YYYY-MM
  profit: number;
}

export interface ProfitYearOut {
  profit_year: ProfitMonth[];
}