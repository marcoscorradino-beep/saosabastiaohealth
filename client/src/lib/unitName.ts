const MUNICIPAL_NAMES: Record<string, string> = {
  "BAREQUECABA": "Barequeçaba",
  "BOICUCANGA I": "Boiçucanga I",
  "BOICUCANGA II": "Boiçucanga II",
  "JARAGUA": "Jaraguá",
  "PAUBA": "Paúba",
  "SAO FRANCISCO": "São Francisco",
};

const LOWERCASE_WORDS = new Set(["da", "das", "de", "do", "dos", "e"]);
const ROMAN_NUMERALS = new Set(["I", "II", "III", "IV", "V", "VI"]);

export function formatUnitName(value: string | null | undefined): string {
  const cleaned = String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/^(USF|UBS|ESF|ESB)\s+/i, "")
    .trim();

  if (!cleaned) return "";

  const upper = cleaned.toLocaleUpperCase("pt-BR");

  if (MUNICIPAL_NAMES[upper]) {
    return MUNICIPAL_NAMES[upper];
  }

  return upper
    .split(" ")
    .map((word, index) => {
      if (ROMAN_NUMERALS.has(word)) return word;

      const lower = word.toLocaleLowerCase("pt-BR");

      if (index > 0 && LOWERCASE_WORDS.has(lower)) {
        return lower;
      }

      return lower.charAt(0).toLocaleUpperCase("pt-BR") + lower.slice(1);
    })
    .join(" ");
}
