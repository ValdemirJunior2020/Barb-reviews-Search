import React from "react";

function escapeRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\\\$&"); }
function highlight(text, q) {
  if (!q) return text;
  const re = new RegExp(`(${escapeRegex(q)})`, "ig");
  const parts = String(text).split(re);
  return parts.map((part, i) => (i % 2 === 1 ? <mark key={i}>{part}</mark> : <span key={i}>{part}</span>));
}

export default function ResultsTable({ rows, headers, query, page, perPage, onPage }) {
  const start = (page - 1) * perPage;
  const pageRows = rows.slice(start, start + perPage);
  const pages = Math.max(1, Math.ceil(rows.length / perPage));

  return (
    <div className="table-wrap">
      <table className="table table-sm table-striped table-hover align-middle">
        <thead className="table-light sticky-top">
          <tr>{headers.map((h) => <th key={h} className="text-nowrap">{h}</th>)}</tr>
        </thead>
        <tbody>
          {pageRows.map((r, i) => (
            <tr key={i}>
              {headers.map((h) => <td key={h}>{highlight(r[h] ?? "", query)}</td>)}
            </tr>
          ))}
          {pageRows.length === 0 && (
            <tr><td colSpan={headers.length} className="text-center py-4">No results</td></tr>
          )}
        </tbody>
      </table>

      <div className="d-flex justify-content-between align-items-center">
        <small className="text-muted">
          Showing {rows.length === 0 ? 0 : start + 1}â€“{Math.min(start + perPage, rows.length)} of {rows.length}
        </small>
        <div className="btn-group">
          <button className="btn btn-outline-secondary btn-sm" disabled={page <= 1} onClick={() => onPage(1)}>&laquo;</button>
          <button className="btn btn-outline-secondary btn-sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>Prev</button>
          <button className="btn btn-outline-secondary btn-sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next</button>
          <button className="btn btn-outline-secondary btn-sm" disabled={page >= pages} onClick={() => onPage(pages)}>&raquo;</button>
        </div>
      </div>
    </div>
  );
}
