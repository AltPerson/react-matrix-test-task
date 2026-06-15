import { createContext, useContext, useRef, useState } from "react";
import type { ReactNode } from "react";
import { clamp, createMatrix, createRow, getMaxX } from "./utils";

export type CellId = number;
export type CellValue = number;

export type Cell = {
  id: CellId;
  amount: CellValue;
};

type MatrixContextValue = {
  matrix: Cell[][];
  columns: number;
  x: number;
  generateMatrix: (rows: number, columns: number, x: number) => void;
  incrementCell: (id: number) => void;
  addRow: () => void;
  removeRow: (rowIndex: number) => void;
};

const MatrixContext = createContext<MatrixContextValue | null>(null);

export const MatrixProvider = ({ children }: { children: ReactNode }) => {
  const [matrix, setMatrix] = useState<Cell[][]>([]);
  const [columns, setColumns] = useState(0);
  const [x, setX] = useState(0);

  const nextIdRef = useRef(1);

  const generateMatrix = (rows: number, columns: number, x: number) => {
    const validRows = clamp(rows, 0, 100);
    const validColumns = clamp(columns, 0, 100);
    const validX = clamp(x, 0, getMaxX(validRows, validColumns));

    const result = createMatrix(validRows, validColumns);

    nextIdRef.current = result.nextId;

    setMatrix(result.matrix);
    setColumns(validColumns);
    setX(validX);
  };

  const incrementCell = (id: number) => {
    setMatrix((currentMatrix) =>
      currentMatrix.map((row) =>
        row.map((cell) => (cell.id === id ? { ...cell, amount: cell.amount + 1 } : cell))
      )
    );
  };

  const addRow = () => {
    if (columns === 0) return;

    const result = createRow(columns, nextIdRef.current);
    nextIdRef.current = result.nextId;

    setMatrix((currentMatrix) => {
      const nextMatrix = [...currentMatrix, result.row];

      setX((currentX) => clamp(currentX, 0, getMaxX(nextMatrix.length, columns)));

      return nextMatrix;
    });
  };

  const removeRow = (rowIndex: number) => {
    setMatrix((currentMatrix) => {
      const nextMatrix = currentMatrix.filter((_, index) => index !== rowIndex);

      setX((currentX) => clamp(currentX, 0, getMaxX(nextMatrix.length, columns)));

      return nextMatrix;
    });
  };

  return (
    <MatrixContext.Provider
      value={{
        matrix,
        columns,
        x,
        generateMatrix,
        incrementCell,
        addRow,
        removeRow,
      }}
    >
      {children}
    </MatrixContext.Provider>
  );
};

export const useMatrix = () => {
  const context = useContext(MatrixContext);

  if (!context) {
    throw new Error("useMatrix must be used inside MatrixProvider");
  }

  return context;
};
