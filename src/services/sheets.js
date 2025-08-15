import axios from "axios";

const API_KEY = (process.env.REACT_APP_SHEETS_API_KEY || "").trim();
const SPREADSHEET_ID = process.env.REACT_APP_SPREADSHEET_ID;
const SHEET_NAME = process.env.REACT_APP_SHEET_NAME || "2025";

// Your sheet currently exposes columns A..R; adjust if needed
const RANGE = `${encodeURIComponent(SHEET_NAME)}!A1:R`;

export async function fetchSheetRows() {
  if (!API_KEY || !SPREADSHEET_ID) {
    throw new Error("Missing API key or spreadsheet ID in .env");
  }
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${RANGE}?key=${API_KEY}`;
  try {
    const { data } = await axios.get(url);
    const values = data?.values || [];
    if (values.length === 0) return [];

    // normalize headers (remove newlines / extra spaces)
    const headers = values[0].map((h) => (h || "").replace(/\s+/g, " ").trim());
    const rows = values.slice(1);

    return rows.map((row) => {
      const obj = {};
      headers.forEach((h, i) => { obj[h || `COL_${i}`] = row[i] ?? ""; });
      return obj;
    });
  } catch (e) {
    console.error("Sheets error:", e?.response?.status, e?.response?.data || e.message);
    throw e;
  }
}
