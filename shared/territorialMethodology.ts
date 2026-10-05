export function shouldShowPopulationLimitAlert(
  score: number | null | undefined,
  populationParameter: number | null | undefined,
  linkedPeople: number | null | undefined,
): boolean {
  return (
    score != null &&
    populationParameter != null &&
    linkedPeople != null &&
    linkedPeople > populationParameter &&
    score >= 10
  );
}
