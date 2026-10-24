import { csvEscape } from "@/lib/inquiryParser";

/** Turn an array of flat-ish objects into a CSV file and download it. Nested values are JSON-stringified. */
export const downloadCsv = (filename: string, rows: Record<string, unknown>[], omit: string[] = []) => {
  if (!rows.length) return false;
  const columns = Array.from(new Set(rows.flatMap((r) => Object.keys(r)))).filter((c) => !omit.includes(c));
  const cell = (v: unknown) => csvEscape(v !== null && typeof v === "object" ? JSON.stringify(v) : v);
  const body = rows.map((r) => columns.map((c) => cell(r[c])).join(","));
  const blob = new Blob([`\uFEFF${[columns.map(csvEscape).join(","), ...body].join("\n")}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
};
