import React from "react";

const QUICK = [
  { label: "Headset", term: "headset" },
  { label: "Connection", term: "connection" },
];

export default function SearchBar({
  query,
  onQuery,
  centers,
  center,
  onCenter,
  issuesOnly,
  onIssuesOnly,
  onQuick,
  onClear,
  onExport,
}) {
  return (
    <div className="mb-3">
      <div className="row g-2 align-items-end">
        <div className="col-12 col-md-5">
          <label className="form-label fw-semibold">Search text</label>
          <input
            className="form-control"
            placeholder='e.g., "headset", "connection", agent nameÃ¢â‚¬Â¦'
            value={query}
            onChange={(e) => onQuery(e.target.value)}
          />
          <div className="form-check mt-2">
            <input
              className="form-check-input"
              type="checkbox"
              id="issuesOnly"
              checked={issuesOnly}
              onChange={(e) => onIssuesOnly(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="issuesOnly">
              Only headset/connection issues
            </label>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <label className="form-label fw-semibold">Filter by Call Center</label>
          <select className="form-select" value={center} onChange={(e) => onCenter(e.target.value)}>
            <option value="">All</option>
            {centers.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="col-12 col-md-3 d-grid gap-2">
          <button className="btn btn-outline-secondary" onClick={onClear}>Clear</button>
          <button className="btn btn-primary" onClick={onExport}>Export PDF (current search)</button>
        </div>
      </div>

      <div className="mt-2 d-flex flex-wrap gap-2">
        {QUICK.map((q) => (
          <span
            key={q.term}
            className="badge text-bg-primary badge-filter"
            onClick={() => onQuick(q.term)}
            title={`Quick search: ${q.term}`}
          >
            {q.label}
          </span>
        ))}
      </div>
    </div>
  );
}
