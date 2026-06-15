import type { Cell } from "./MatrixContext";

export const clamp = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, min), max);
};

export const getMaxX = (rows: number, columns: number) => {
  return Math.max(0, rows * columns - 1);
};

export const randomAmount = () => {
  return Math.floor(Math.random() * 900) + 100;
};

export const createRow = (columns: number, startId: number) => {
  let nextId = startId;

  const row: Cell[] = Array.from({ length: columns }, () => ({
    id: nextId++,
    amount: randomAmount(),
  }));

  return { row, nextId };
};

export const createMatrix = (rows: number, columns: number, startId = 1) => {
  let nextId = startId;

  const matrix: Cell[][] = Array.from({ length: rows }, () => {
    const result = createRow(columns, nextId);
    nextId = result.nextId;
    return result.row;
  });

  return { matrix, nextId };
};

export const getRowSum = (row: Cell[]) => {
  return row.reduce((sum, cell) => sum + cell.amount, 0);
};

export const getPercentile = (values: number[], percentile: number) => {
  if (!values.length) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const index = (sorted.length - 1) * percentile;

  const lower = Math.floor(index);
  const upper = Math.ceil(index);

  if (lower === upper) return sorted[lower];

  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
};

export const formatNumber = (value: number) => {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
};
