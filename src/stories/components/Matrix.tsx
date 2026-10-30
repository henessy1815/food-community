import type { ReactNode } from 'react';

/** 스토리 문서용 — 타입(행) × 상태(열) 정렬 */
export function Matrix<R extends string, C extends string>({
  title,
  rows,
  cols,
  render,
  rowLabel = (r) => r,
}: {
  title?: string;
  rows: readonly R[];
  cols: readonly C[];
  render: (row: R, col: C) => ReactNode;
  rowLabel?: (row: R) => ReactNode;
}) {
  return (
    <section className="flex flex-col gap-[12px]">
      {title && <h2 className="heading-md">{title}</h2>}
      <table className="border-separate border-spacing-x-[24px] border-spacing-y-[12px] -mx-[24px]">
        <thead>
          <tr>
            <th />
            {cols.map((c) => (
              <th key={c} className="text-left label-md text-text-tertiary">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r}>
              <th className="pr-[8px] text-left align-middle label-lg whitespace-nowrap text-text-secondary">
                {rowLabel(r)}
              </th>
              {cols.map((c) => (
                <td key={c} className="align-top">
                  {render(r, c)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
