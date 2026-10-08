export interface RankingRow {
  ine: string;
  teamType?: string;
  value: number | null;
}

export function teamKey(row: RankingRow): string {
  return `${row.teamType ?? ""}:${row.ine}`;
}

export function buildRankingPositions(
  rows: readonly RankingRow[],
): Map<string, number> {
  const sorted = [...rows]
    .filter(
      (row): row is RankingRow & { value: number } =>
        typeof row.value === "number" && Number.isFinite(row.value),
    )
    .sort((a, b) => b.value - a.value);

  const positions = new Map<string, number>();

  let previousValue: number | undefined;
  let position = 0;

  sorted.forEach((row, index) => {
    if (previousValue === undefined || row.value !== previousValue) {
      position = index + 1;
    }

    positions.set(teamKey(row), position);
    previousValue = row.value;
  });

  return positions;
}

export function rankingMovement(
  currentPosition: number | undefined,
  previousPosition: number | undefined,
): number | null {
  if (currentPosition == null || previousPosition == null) {
    return null;
  }

  return previousPosition - currentPosition;
}

export function resultVariation(
  currentValue: number | null,
  previousValue: number | null,
): number | null {
  if (
    currentValue == null ||
    previousValue == null ||
    !Number.isFinite(currentValue) ||
    !Number.isFinite(previousValue)
  ) {
    return null;
  }

  return currentValue - previousValue;
}
