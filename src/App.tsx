import { useMemo, useState, type CSSProperties, type SubmitEvent } from "react";
import { useMatrix, type Cell } from "./MatrixContext";
import { clamp, formatNumber, getMaxX, getPercentile, getRowSum } from "./utils";

type FormState = {
  rows: number;
  columns: number;
  x: number;
};

const DEFAULT_FORM: FormState = {
  rows: 5,
  columns: 5,
  x: 5,
};

function App() {
  const { matrix, columns, x, generateMatrix, incrementCell, addRow, removeRow } =
    useMatrix();

  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [hoveredCell, setHoveredCell] = useState<Cell | null>(null);
  const [hoveredSumRow, setHoveredSumRow] = useState<number | null>(null);

  const rows = matrix.length;
  const formMaxX = getMaxX(form.rows, form.columns);

  const percentiles = useMemo(() => {
    return Array.from({ length: columns }, (_, columnIndex) => {
      const columnValues = matrix
        .map((row) => row[columnIndex])
        .filter((cell): cell is Cell => Boolean(cell))
        .map((cell) => cell.amount);

      return getPercentile(columnValues, 0.6);
    });
  }, [matrix, columns]);

  const nearestCellIds = useMemo(() => {
    if (!hoveredCell || x === 0) return new Set<number>();

    const nearestCells = matrix
      .flat()
      .filter((cell) => cell.id !== hoveredCell.id)
      .sort((a, b) => {
        const diffA = Math.abs(a.amount - hoveredCell.amount);
        const diffB = Math.abs(b.amount - hoveredCell.amount);

        if (diffA === diffB) return a.id - b.id;

        return diffA - diffB;
      })
      .slice(0, x);

    return new Set(nearestCells.map((cell) => cell.id));
  }, [hoveredCell, matrix, x]);

  const handleSubmit = (event: SubmitEvent) => {
    event.preventDefault();

    generateMatrix(
      clamp(form.rows, 0, 100),
      clamp(form.columns, 0, 100),
      clamp(form.x, 0, formMaxX)
    );
  };

  const updateFormNumber = (key: keyof FormState, value: string) => {
    const numberValue = Number(value);

    setForm((currentForm) => ({
      ...currentForm,
      [key]: Number.isNaN(numberValue) ? 0 : numberValue,
    }));
  };

  return (
    <main className="app">
      <section className="panel">
        <div>
          <h1>Matrix Test Task</h1>
          <p className="muted">
            M rows, N columns, X nearest cells. Click a cell to increase value.
          </p>
        </div>

        <form className="form" onSubmit={handleSubmit}>
          <label>
            <span>M rows(0 - 100)</span>
            <input
              type="number"
              min={0}
              max={100}
              value={form.rows}
              onChange={(event) => updateFormNumber("rows", event.target.value)}
            />
          </label>

          <label>
            <span>N columns(0 - 100)</span>
            <input
              type="number"
              min={0}
              max={100}
              value={form.columns}
              onChange={(event) => updateFormNumber("columns", event.target.value)}
            />
          </label>

          <label>
            <span>X nearest (0 - {formMaxX})</span>
            <input
              type="number"
              min={0}
              max={formMaxX}
              value={form.x}
              onChange={(event) => updateFormNumber("x", event.target.value)}
            />
          </label>

          <button type="submit">Generate</button>
        </form>
      </section>

      <section className="panel">
        <div className="table-header">
          <div>
            <h2>Table</h2>
            <p className="muted">
              Rows: {rows}, columns: {columns}, X: {x}
            </p>
          </div>

          <button onClick={addRow} disabled={columns === 0}>
            Add row
          </button>
        </div>

        {matrix.length > 0 && columns > 0 ? (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Row</th>

                  {Array.from({ length: columns }, (_, index) => (
                    <th key={index}>N {index + 1}</th>
                  ))}

                  <th>Sum</th>
                  <th />
                </tr>
              </thead>

              <tbody>
                {matrix.map((row, rowIndex) => {
                  const rowSum = getRowSum(row);
                  const rowMax = Math.max(...row.map((cell) => cell.amount));
                  const isPercentRow = hoveredSumRow === rowIndex;

                  return (
                    <tr key={row.map((cell) => cell.id).join("-")}>
                      <th>M {rowIndex + 1}</th>

                      {row.map((cell) => {
                        const percentFromTotal =
                          rowSum === 0 ? 0 : Math.round((cell.amount / rowSum) * 100);

                        const heatRatio = rowMax === 0 ? 0 : cell.amount / rowMax;
                        const heatOpacity = 0.15 + heatRatio * 0.55;

                        const cellStyle = isPercentRow
                          ? ({
                              backgroundColor: `rgba(52, 211, 153, ${heatOpacity})`,
                            } as CSSProperties)
                          : undefined;

                        const className = [
                          "data-cell",
                          nearestCellIds.has(cell.id) ? "nearest-cell" : "",
                          isPercentRow ? "percent-cell" : "",
                        ]
                          .filter(Boolean)
                          .join(" ");

                        return (
                          <td
                            key={cell.id}
                            className={className}
                            style={cellStyle}
                            onClick={() => incrementCell(cell.id)}
                            onMouseEnter={() => setHoveredCell(cell)}
                            onMouseLeave={() => setHoveredCell(null)}
                            title={`Cell id: ${cell.id}`}
                          >
                            <span>
                              {isPercentRow ? `${percentFromTotal}%` : cell.amount}
                            </span>
                          </td>
                        );
                      })}

                      <td
                        className="sum-cell"
                        onMouseEnter={() => {
                          setHoveredCell(null);
                          setHoveredSumRow(rowIndex);
                        }}
                        onMouseLeave={() => setHoveredSumRow(null)}
                      >
                        {rowSum}
                      </td>

                      <td>
                        <button
                          className="remove-button"
                          onClick={() => removeRow(rowIndex)}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              <tfoot>
                <tr>
                  <th>60th percentile</th>

                  {percentiles.map((value, index) => (
                    <td key={index}>{formatNumber(value)}</td>
                  ))}

                  <td />
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <p className="empty">Generate matrix to see the table.</p>
        )}
      </section>
    </main>
  );
}

export default App;
