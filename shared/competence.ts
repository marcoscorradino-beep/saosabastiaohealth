const MONTHS = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"] as const;
const MONTH_INDEX = new Map(MONTHS.map((month, index) => [month, index + 1]));

export type MonthlyCompetence = `${typeof MONTHS[number]}/${string}`;

export function parseMonthlyCompetence(value: string | null | undefined): string | null {
  const normalized = (value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toUpperCase();
  const match = normalized.match(/^(JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)\s*\/\s*(\d{2})$/);
  return match ? `${match[1]}/${match[2]}` : null;
}

export function monthlyCompetenceKey(value: string): number | null {
  const competence = parseMonthlyCompetence(value);
  if (!competence) return null;
  const [month, year] = competence.split("/");
  return Number(year) * 12 + (MONTH_INDEX.get(month as typeof MONTHS[number]) || 0);
}

export function compareMonthlyCompetences(a: string, b: string) {
  const keyA = monthlyCompetenceKey(a);
  const keyB = monthlyCompetenceKey(b);
  if (keyA !== null && keyB !== null) return keyA - keyB;
  return a.localeCompare(b, "pt-BR");
}

export function isMonthlyCompetence(value: string) {
  return parseMonthlyCompetence(value) !== null;
}
