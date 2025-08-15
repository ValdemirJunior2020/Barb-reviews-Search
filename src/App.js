import React, { useEffect, useMemo, useState } from "react";
import { fetchSheetRows } from "./services/sheets";
import SearchBar from "./components/SearchBar";
import ResultsTable from "./components/ResultsTable";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const CALL_CENTER_HEADERS = ["Call Center","call center","Center","CallCenter"];
const DEFAULT_ISSUE_TERMS = ["headset", "connection"]; // add "mic","audio" if you want

export default function App() {
  const [loading, setLoading] = useState(true);
  const [allRows, setAllRows] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [error, setError] = useState("");

  const [query, setQuery] = useState("");
  const [issuesOnly, setIssuesOnly] = useState(false);
  const [center, setCenter] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 25;

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const rows = await fetchSheetRows();
        setAllRows(rows);
        setHeaders(rows.length ? Object.keys(rows[0]) : []);
      } catch (e) {
        setError(e.message || "Failed to load sheet");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const callCenterField = useMemo(() => {
    const setHdrs = new Set(headers.map(h => h.toLowerCase()));
    for (const h of CALL_CENTER_HEADERS) {
      if (setHdrs.has(h.toLowerCase())) return headers.find(x => x.toLowerCase() === h.toLowerCase());
    }
    return headers.find(h => h.toLowerCase().includes("call") && h.toLowerCase().includes("center")) || headers[0];
  }, [headers]);

  const centers = useMemo(() => {
    const s = new Set();
    allRows.forEach(r => {
      const v = (r[callCenterField] ?? "").toString().trim();
      if (v) s.add(v);
    });
    return Array.from(s).sort();
  }, [allRows, callCenterField]);

  const activeTerms = useMemo(() => {
    if (query.trim()) {
      const parts = query.toLowerCase().trim().split(/[| ]+/).filter(Boolean);
      return parts.length ? parts : [];
    }
    return issuesOnly ? DEFAULT_ISSUE_TERMS : [];
  }, [query, issuesOnly]);

  const rowMatches = (row) => {
    if (!activeTerms.length) return true;
    return headers.some((h) => {
      const val = String(row[h] ?? "").toLowerCase();
      return activeTerms.some((t) => val.includes(t));
    });
  };

  const filtered = useMemo(() => {
    let r = allRows.filter(rowMatches);
    if (center) r = r.filter(row => String(row[callCenterField] ?? "").trim() === center);
    return r;
  }, [allRows, activeTerms, center, callCenterField, headers]);

  const counts = useMemo(() => {
    const map = new Map();
    filtered.forEach(r => {
      const c = String(r[callCenterField] ?? "").trim() || "(Unknown)";
      map.set(c, (map.get(c) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a,b) => b[1]-a[1]);
  }, [filtered, callCenterField]);

  const handleQuick = (term) => { setQuery(term); setIssuesOnly(false); setPage(1); };
  const handleClear = () => { setQuery(""); setIssuesOnly(false); setCenter(""); setPage(1); };

  function pickHeader(nameHints) {
    const lower = headers.map(h => [h, h.toLowerCase()]);
    for (const hint of nameHints) {
      const tokens = hint.toLowerCase().split(" ");
      const found = lower.find(([orig, low]) => tokens.every(t => low.includes(t)));
      if (found) return found[0];
    }
    return null;
  }

  const hTimestamp = pickHeader(["Timestamp"]);
  const hAgent = pickHeader(["Agent's Name","Agent Name","Agent"]);
  const hConcern = pickHeader(["Concern for Review","Concern","Review"]);
  const hType = pickHeader(["type of feedback","feedback"]);
  const hItin = pickHeader(["Itinerary #","Itinerary"]);

  const handleExport = () => {
    const termLabel = activeTerms.length ? activeTerms.join(" OR ") : "(all rows)";
    const doc = new jsPDF({ compress: true });
    const today = new Date().toLocaleString();

    doc.setFontSize(16);
    doc.text(`Reviews Search – "${termLabel}"`, 14, 18);
    doc.setFontSize(10);
    doc.text(`Generated: ${today}`, 14, 24);

    const summaryHead = [["Call Center", `Mentions of "${termLabel}"`]];
    const summaryRows = counts.map(([c, n]) => [c, String(n)]);
    autoTable(doc, {
      head: summaryHead,
      body: summaryRows,
      startY: 30,
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [33, 150, 243] },
      theme: "striped",
    });

    let y = (doc.lastAutoTable && doc.lastAutoTable.finalY) || 30;

    counts.forEach(([c]) => {
      const rowsForCenter = filtered.filter(r => String(r[callCenterField] ?? "").trim() === c);
      if (!rowsForCenter.length) return;

      y += 8;
      if (y > 270) { doc.addPage(); y = 20; }
      doc.setFontSize(13);
      doc.text(`${c} — ${rowsForCenter.length} match(es)`, 14, y);

      const headCols = [
        ...(hTimestamp ? [hTimestamp] : []),
        ...(hAgent ? [hAgent] : []),
        ...(hConcern ? [hConcern] : []),
        ...(hType ? [hType] : []),
        ...(hItin ? [hItin] : []),
      ];
      const body = rowsForCenter.map((r) => [
        ...(hTimestamp ? [String(r[hTimestamp] ?? "")] : []),
        ...(hAgent ? [String(r[hAgent] ?? "")] : []),
        ...(hConcern ? [String(r[hConcern] ?? "").slice(0, 180)] : []),
        ...(hType ? [String(r[hType] ?? "")] : []),
        ...(hItin ? [String(r[hItin] ?? "")] : []),
      ]);

      autoTable(doc, {
        head: [headCols.length ? headCols : ["Row"]],
        body: headCols.length ? body : rowsForCenter.map((r, i) => [`#${i+1}`]),
        startY: y + 4,
        styles: { fontSize: 8, cellPadding: 2, overflow: "linebreak" },
        headStyles: { fillColor: [200, 200, 200] },
        theme: "striped",
        columnStyles: { 2: { cellWidth: 110 } },
      });

      y = (doc.lastAutoTable && doc.lastAutoTable.finalY) || y;
    });

    const filename = `reviews_${termLabel.replace(/[^\w-]+/g, "_")}.pdf`;
    doc.save(filename);
  };

  return (
    <div className="container py-4">
      <h1 className="h3 mb-3">Reviews Search (Google Sheets – {process.env.REACT_APP_SHEET_NAME})</h1>

      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <SearchBar
            query={query}
            onQuery={(v) => { setQuery(v); setPage(1); }}
            centers={centers}
            center={center}
            onCenter={(v) => { setCenter(v); setPage(1); }}
            issuesOnly={issuesOnly}
            onIssuesOnly={(v) => { setIssuesOnly(v); setPage(1); }}
            onQuick={handleQuick}
            onClear={handleClear}
            onExport={handleExport}
          />

          {error && <div className="alert alert-danger">{error}</div>}
          {loading && <div className="text-muted">Loading sheet…</div>}

          {!loading && !error && (
            <>
              <div className="mb-3 d-flex flex-wrap gap-2">
                {counts.map(([c, n]) => (
                  <span key={c} className="badge text-bg-secondary">{c}: {n}</span>
                ))}
                {counts.length === 0 && <span className="text-muted">No matches yet</span>}
              </div>

              <ResultsTable
                rows={filtered}
                headers={headers}
                query={activeTerms.join(" | ")}
                page={page}
                perPage={perPage}
                onPage={setPage}
              />
            </>
          )}
        </div>
      </div>

      <div className="text-muted small">
        Tip: toggle <em>Only headset/connection issues</em> or type anything (supports <code>headset|connection</code>).
      </div>
    </div>
  );
}
