import { Fragment, ReactNode, useState } from "react";
import { Check, Copy } from "lucide-react";
import { BlockError, CardSpec, ChartSpec, EmmaCards, EmmaChart, EmmaStats, StatSpec } from "./blocks";

/* A small, dependency-free markdown renderer. It builds React nodes (never raw HTML), so model output can't inject markup. */

const INLINE = /(\*\*[^*\n]+\*\*|__[^_\n]+__|`[^`\n]+`|\[[^\]\n]+\]\([^)\s]+\)|\*[^*\n]+\*|~~[^~\n]+~~|https?:\/\/[^\s<)]+)/g;

export const inline = (text: string, keyPrefix = "i"): ReactNode[] =>
  text.split(INLINE).map((part, i) => {
    if (!part) return null;
    const key = `${keyPrefix}${i}`;
    if (/^\*\*.+\*\*$/.test(part) || /^__.+__$/.test(part)) return <strong key={key} className="font-semibold text-white">{inline(part.slice(2, -2), key)}</strong>;
    if (/^`.+`$/.test(part)) return <code key={key} className="rounded bg-black/40 px-1.5 py-0.5 font-mono text-[0.85em] text-sky-200">{part.slice(1, -1)}</code>;
    if (/^~~.+~~$/.test(part)) return <del key={key} className="text-white/50">{part.slice(2, -2)}</del>;
    const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part);
    if (link) {
      const safe = /^(https?:\/\/|\/|mailto:|tel:)/.test(link[2]);
      return safe ? <a key={key} href={link[2]} target={link[2].startsWith("/") ? undefined : "_blank"} rel="noopener noreferrer" className="text-sky-300 underline decoration-sky-300/40 underline-offset-2 hover:decoration-sky-300">{link[1]}</a> : <span key={key}>{link[1]}</span>;
    }
    if (/^\*.+\*$/.test(part)) return <em key={key}>{inline(part.slice(1, -1), key)}</em>;
    if (/^https?:\/\//.test(part)) return <a key={key} href={part} target="_blank" rel="noopener noreferrer" className="break-all text-sky-300 underline decoration-sky-300/40 underline-offset-2">{part}</a>;
    return <Fragment key={key}>{part}</Fragment>;
  });

const CodeBlock = ({ code, lang }: { code: string; lang?: string }) => {
  const [copied, setCopied] = useState(false);
  return (
    <div className="my-3 overflow-hidden rounded-lg border border-white/10 bg-black/40">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-1 text-[11px] text-white/45">
        <span>{lang || "text"}</span>
        <button className="flex items-center gap-1 hover:text-white" onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
          {copied ? <><Check className="h-3 w-3" />Copied</> : <><Copy className="h-3 w-3" />Copy</>}
        </button>
      </div>
      <pre className="overflow-x-auto p-3 text-xs leading-relaxed text-slate-200"><code>{code}</code></pre>
    </div>
  );
};

const parseJson = (raw: string): any => { try { return JSON.parse(raw); } catch { return undefined; } };

const rich = (lang: string, body: string, key: string): ReactNode => {
  const data = parseJson(body);
  if (data === undefined) return <BlockError key={key} text="Preparing visual…" />;
  if (lang === "emma-chart") return Array.isArray(data?.data) ? <EmmaChart key={key} spec={data as ChartSpec} /> : <BlockError key={key} text="This chart is missing data." />;
  if (lang === "emma-card" || lang === "emma-cards") {
    const specs: CardSpec[] = (Array.isArray(data) ? data : data?.cards ? data.cards : [data]).filter((c: any) => c?.title);
    return specs.length ? <EmmaCards key={key} specs={specs} /> : <BlockError key={key} text="This card is missing a title." />;
  }
  if (lang === "emma-stats") {
    const stats: StatSpec[] = Array.isArray(data) ? data : data?.stats;
    return Array.isArray(stats) && stats.length ? <EmmaStats key={key} stats={stats} /> : <BlockError key={key} text="No stats to show." />;
  }
  return null;
};

const splitRow = (line: string) => line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
const isTableSep = (line: string) => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(line);

export const Markdown = ({ text }: { text: string }) => {
  const lines = (text || "").replace(/\r\n/g, "\n").split("\n");
  const out: ReactNode[] = [];
  let i = 0;
  let k = 0;
  const key = () => `b${k++}`;

  while (i < lines.length) {
    const line = lines[i];

    // fenced block
    const fence = /^\s*```\s*([\w-]*)\s*$/.exec(line);
    if (fence) {
      const lang = fence[1].toLowerCase();
      const body: string[] = [];
      i++;
      let closed = false;
      while (i < lines.length) {
        if (/^\s*```\s*$/.test(lines[i])) { closed = true; i++; break; }
        body.push(lines[i]); i++;
      }
      if (lang.startsWith("emma-")) {
        out.push(closed ? rich(lang, body.join("\n"), key()) : <BlockError key={key()} text="Preparing visual…" />);
      } else out.push(<CodeBlock key={key()} code={body.join("\n")} lang={lang} />);
      continue;
    }

    if (!line.trim()) { i++; continue; }

    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      const cls = level === 1 ? "mt-4 mb-2 text-lg font-semibold text-white" : level === 2 ? "mt-4 mb-1.5 text-base font-semibold text-white" : "mt-3 mb-1 text-sm font-semibold text-white";
      out.push(<div key={key()} role="heading" aria-level={level} className={cls}>{inline(heading[2])}</div>);
      i++; continue;
    }

    if (/^\s*([-*_])\s*(\1\s*){2,}$/.test(line)) { out.push(<hr key={key()} className="my-3 border-white/10" />); i++; continue; }

    // table
    if (line.includes("|") && i + 1 < lines.length && isTableSep(lines[i + 1])) {
      const head = splitRow(line);
      const align = splitRow(lines[i + 1]).map((c) => (c.startsWith(":") && c.endsWith(":") ? "center" : c.endsWith(":") ? "right" : "left"));
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes("|") && lines[i].trim()) { rows.push(splitRow(lines[i])); i++; }
      out.push(
        <div key={key()} className="my-3 overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full min-w-max border-collapse text-left text-xs">
            <thead className="bg-white/[0.07] text-white/80">
              <tr>{head.map((h, c) => <th key={c} className="px-3 py-2 font-semibold" style={{ textAlign: align[c] as any }}>{inline(h)}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map((r, ri) => <tr key={ri} className="hover:bg-white/[0.03]">{head.map((_, c) => <td key={c} className="px-3 py-2 text-white/80" style={{ textAlign: align[c] as any }}>{inline(r[c] ?? "")}</td>)}</tr>)}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    // blockquote
    if (/^\s*>/.test(line)) {
      const q: string[] = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) { q.push(lines[i].replace(/^\s*>\s?/, "")); i++; }
      out.push(<blockquote key={key()} className="my-3 border-l-2 border-sky-400/60 pl-3 text-sm text-white/70">{q.map((l, n) => <p key={n}>{inline(l)}</p>)}</blockquote>);
      continue;
    }

    // lists (indent aware, flat rendering with padding)
    if (/^\s*([-*+]|\d+[.)])\s+/.test(line)) {
      const items: { indent: number; ordered: boolean; num: string; text: string; done?: boolean }[] = [];
      while (i < lines.length) {
        const m = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/.exec(lines[i]);
        if (!m) {
          if (lines[i].trim() && /^\s{2,}\S/.test(lines[i]) && items.length) { items[items.length - 1].text += " " + lines[i].trim(); i++; continue; }
          break;
        }
        const task = /^\[( |x|X)\]\s+(.*)$/.exec(m[3]);
        items.push({ indent: Math.floor(m[1].replace(/\t/g, "  ").length / 2), ordered: /\d/.test(m[2]), num: m[2], text: task ? task[2] : m[3], done: task ? task[1] !== " " : undefined });
        i++;
      }
      out.push(
        <ul key={key()} className="my-2 space-y-1">
          {items.map((it, n) => (
            <li key={n} className="flex gap-2 text-sm leading-relaxed text-white/85" style={{ paddingLeft: it.indent * 16 }}>
              <span className="w-5 shrink-0 text-right text-white/45">
                {it.done !== undefined ? (it.done ? "☑" : "☐") : it.ordered ? it.num : "•"}
              </span>
              <span className={it.done ? "text-white/45 line-through" : ""}>{inline(it.text)}</span>
            </li>
          ))}
        </ul>,
      );
      continue;
    }

    // paragraph
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^\s*(```|#{1,6}\s|>|([-*+]|\d+[.)])\s)/.test(lines[i]) && !(lines[i].includes("|") && i + 1 < lines.length && isTableSep(lines[i + 1]))) { para.push(lines[i]); i++; }
    if (!para.length) { para.push(lines[i]); i++; }
    out.push(<p key={key()} className="my-2 text-sm leading-relaxed text-white/85">{para.map((l, n) => <Fragment key={n}>{n > 0 && <br />}{inline(l)}</Fragment>)}</p>);
  }

  return <div className="min-w-0 break-words [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">{out}</div>;
};
