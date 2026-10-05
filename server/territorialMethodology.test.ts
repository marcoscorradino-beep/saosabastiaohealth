import { describe, expect, it } from "vitest";
import { shouldShowPopulationLimitAlert } from "@shared/territorialMethodology";

describe("alerta de limite populacional do Territorial", () => {
  it("exibe alerta somente quando excede o parâmetro e atinge o teto de 10", () => {
    expect(shouldShowPopulationLimitAlert(10, 2750, 3282)).toBe(true);    // Barra do Sai
    expect(shouldShowPopulationLimitAlert(10, 2750, 3606)).toBe(true);    // Canto do Mar
    expect(shouldShowPopulationLimitAlert(10, 2750, 3110)).toBe(true);    // Jaraguá
    expect(shouldShowPopulationLimitAlert(8.25, 2750, 2779)).toBe(false); // Maresias III
    expect(shouldShowPopulationLimitAlert(10, 2750, 2319)).toBe(false);   // abaixo do parâmetro
  });
});
