export function money(n: number): number {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

export function qty(n: number): number {
  return Math.round((Number(n) + Number.EPSILON) * 1000) / 1000;
}

export function nearlyEqual(a: number, b: number, eps = 0.0001): boolean {
  return Math.abs(a - b) < eps;
}
