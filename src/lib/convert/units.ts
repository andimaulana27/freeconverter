export type UnitKind = "mass" | "length" | "temp";

const MASS: Record<string, number> = { kg: 1, g: 0.001, lb: 0.45359237, oz: 0.0283495231 };
const LENGTH: Record<string, number> = { m: 1, cm: 0.01, km: 1000, ft: 0.3048, in: 0.0254 };

export const UNIT_OPTIONS: Record<UnitKind, { id: string; label: string }[]> = {
  mass: [
    { id: "kg", label: "kg" },
    { id: "g", label: "g" },
    { id: "lb", label: "lb" },
    { id: "oz", label: "oz" },
  ],
  length: [
    { id: "m", label: "m" },
    { id: "cm", label: "cm" },
    { id: "km", label: "km" },
    { id: "ft", label: "ft" },
    { id: "in", label: "in" },
  ],
  temp: [
    { id: "c", label: "°C" },
    { id: "f", label: "°F" },
  ],
};

function toCelsius(value: number, from: string) {
  return from === "f" ? ((value - 32) * 5) / 9 : value;
}

function fromCelsius(value: number, to: string) {
  return to === "f" ? (value * 9) / 5 + 32 : value;
}

export function convertUnit(kind: UnitKind, amount: number, from: string, to: string) {
  if (!Number.isFinite(amount)) throw new Error("Angka tidak valid.");
  if (kind === "temp") return fromCelsius(toCelsius(amount, from), to);
  const table = kind === "mass" ? MASS : LENGTH;
  const a = table[from];
  const b = table[to];
  if (!a || !b) throw new Error("Satuan tidak dikenal.");
  return (amount * a) / b;
}

export function formatUnit(value: number) {
  const abs = Math.abs(value);
  const digits = abs >= 100 ? 2 : abs >= 1 ? 4 : 6;
  return Number(value.toFixed(digits)).toString();
}
