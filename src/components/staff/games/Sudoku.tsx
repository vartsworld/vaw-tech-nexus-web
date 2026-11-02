import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Eraser, Lightbulb, PencilLine, RotateCcw, Trophy } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type Difficulty = "easy" | "medium" | "hard";

/** Number of cells left empty for each level. */
const BLANKS: Record<Difficulty, number> = { easy: 38, medium: 47, hard: 54 };
const COINS: Record<Difficulty, number> = { easy: 5, medium: 10, hard: 20 };

type Grid = number[]; // 81 numbers, 0 = empty

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const row = (i: number) => Math.floor(i / 9);
const col = (i: number) => i % 9;
const box = (i: number) => Math.floor(row(i) / 3) * 3 + Math.floor(col(i) / 3);

const PEERS: number[][] = Array.from({ length: 81 }, (_, i) => {
  const out: number[] = [];
  for (let j = 0; j < 81; j++) {
    if (j !== i && (row(j) === row(i) || col(j) === col(i) || box(j) === box(i))) out.push(j);
  }
  return out;
});

const candidates = (g: Grid, i: number): number[] => {
  const used = new Set<number>();
  for (const p of PEERS[i]) if (g[p]) used.add(g[p]);
  const out: number[] = [];
  for (let n = 1; n <= 9; n++) if (!used.has(n)) out.push(n);
  return out;
};

/** Backtracking with "fewest candidates first". Counts solutions up to `limit`; fills `g` with the first solution when `fill` is set. */
const solve = (g: Grid, limit: number, fill: boolean, randomise = false): number => {
  let best = -1;
  let bestCands: number[] = [];
  for (let i = 0; i < 81; i++) {
    if (g[i]) continue;
    const c = candidates(g, i);
    if (c.length === 0) return 0;
    if (best === -1 || c.length < bestCands.length) {
      best = i;
      bestCands = c;
      if (c.length === 1) break;
    }
  }
  if (best === -1) return 1;

  let count = 0;
  for (const n of randomise ? shuffle(bestCands) : bestCands) {
    g[best] = n;
    count += solve(g, limit - count, fill, randomise);
    if (count >= limit) {
      if (!fill) g[best] = 0;
      return count;
    }
    g[best] = 0;
  }
  return count;
};

const generate = (difficulty: Difficulty): { puzzle: Grid; solution: Grid } => {
  const solution: Grid = Array(81).fill(0);
  // Fill the diagonal boxes first for a quick random start, then solve the rest.
  for (let b = 0; b < 3; b++) {
    const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    for (let k = 0; k < 9; k++) solution[(b * 3 + Math.floor(k / 3)) * 9 + b * 3 + (k % 3)] = nums[k];
  }
  // fill = true leaves the first solution found in `solution`.
  solve(solution, 1, true, true);

  const puzzle = [...solution];
  let removed = 0;
  const target = BLANKS[difficulty];
  for (const idx of shuffle(Array.from({ length: 81 }, (_, i) => i))) {
    if (removed >= target) break;
    const keep = puzzle[idx];
    puzzle[idx] = 0;
    // Only keep the removal if the puzzle still has exactly one solution.
    if (solve([...puzzle], 2, false) !== 1) puzzle[idx] = keep;
    else removed++;
  }
  return { puzzle, solution };
};

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

interface SudokuProps {
  userId?: string;
  onClose?: () => void;
}

export default function Sudoku({ userId }: SudokuProps) {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [game, setGame] = useState(() => generate("easy"));
  const [values, setValues] = useState<Grid>(() => [...game.puzzle]);
  const [notes, setNotes] = useState<Record<number, number[]>>({});
  const [selected, setSelected] = useState<number | null>(null);
  const [pencil, setPencil] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [hints, setHints] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [won, setWon] = useState(false);
  const rewarded = useRef(false);

  const startGame = useCallback((level: Difficulty) => {
    const next = generate(level);
    setDifficulty(level);
    setGame(next);
    setValues([...next.puzzle]);
    setNotes({});
    setSelected(null);
    setPencil(false);
    setMistakes(0);
    setHints(0);
    setSeconds(0);
    setWon(false);
    rewarded.current = false;
  }, []);

  useEffect(() => {
    if (won) return;
    const t = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(t);
  }, [won]);

  const given = (i: number) => game.puzzle[i] !== 0;

  const conflicts = useMemo(() => {
    const bad = new Set<number>();
    for (let i = 0; i < 81; i++) {
      if (!values[i]) continue;
      if (PEERS[i].some((p) => values[p] === values[i])) bad.add(i);
    }
    return bad;
  }, [values]);

  const counts = useMemo(() => {
    const c = Array(10).fill(0);
    values.forEach((v) => { if (v) c[v]++; });
    return c;
  }, [values]);

  const finish = useCallback(async (usedHints: number, level: Difficulty) => {
    setWon(true);
    if (rewarded.current) return;
    rewarded.current = true;
    const coins = Math.max(0, COINS[level] - usedHints);
    if (!userId || coins <= 0) return;
    try {
      const { error } = await supabase.from("user_coin_transactions").insert({
        user_id: userId,
        coins,
        transaction_type: "hr_grant",
        category: "other",
        reason: `Earned ${coins} coins solving a ${level.toUpperCase()} Sudoku`,
      } as any);
      if (error) throw error;
      toast.success(`Solved! Earned ${coins} coins`);
    } catch (e) {
      console.error(e);
    }
  }, [userId]);

  const place = (n: number) => {
    if (selected === null || won || given(selected)) return;
    if (pencil) {
      if (values[selected]) return;
      setNotes((prev) => {
        const cur = prev[selected] || [];
        return { ...prev, [selected]: cur.includes(n) ? cur.filter((x) => x !== n) : [...cur, n].sort() };
      });
      return;
    }
    const next = [...values];
    next[selected] = values[selected] === n ? 0 : n;
    setValues(next);
    setNotes((prev) => {
      const copy = { ...prev };
      delete copy[selected];
      // Placing a number clears it from the pencil marks of its peers.
      for (const p of PEERS[selected]) {
        if (copy[p]?.includes(n)) copy[p] = copy[p].filter((x) => x !== n);
      }
      return copy;
    });
    if (next[selected] && next[selected] !== game.solution[selected]) setMistakes((m) => m + 1);
    if (next.every((v, i) => v === game.solution[i])) finish(hints, difficulty);
  };

  const erase = () => {
    if (selected === null || won || given(selected)) return;
    setValues((v) => { const c = [...v]; c[selected] = 0; return c; });
    setNotes((prev) => { const c = { ...prev }; delete c[selected]; return c; });
  };

  const hint = () => {
    if (won) return;
    let target = selected !== null && !given(selected) && values[selected] !== game.solution[selected] ? selected : -1;
    if (target === -1) target = values.findIndex((v, i) => !given(i) && v !== game.solution[i]);
    if (target === -1) return;
    const next = [...values];
    next[target] = game.solution[target];
    setValues(next);
    setSelected(target);
    setHints((h) => h + 1);
    setNotes((prev) => { const c = { ...prev }; delete c[target]; return c; });
    if (next.every((v, i) => v === game.solution[i])) finish(hints + 1, difficulty);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key >= "1" && e.key <= "9") { e.preventDefault(); place(Number(e.key)); return; }
    if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") { e.preventDefault(); erase(); return; }
    if (e.key.toLowerCase() === "n") { setPencil((p) => !p); return; }
    const moves: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -9, ArrowDown: 9 };
    if (moves[e.key] !== undefined) {
      e.preventDefault();
      setSelected((s) => {
        const from = s ?? 40;
        if (e.key === "ArrowLeft" && col(from) === 0) return from;
        if (e.key === "ArrowRight" && col(from) === 8) return from;
        const to = from + moves[e.key];
        return to < 0 || to > 80 ? from : to;
      });
    }
  };

  const selVal = selected !== null ? values[selected] : 0;

  return (
    <div className="mx-auto w-full max-w-md space-y-4 text-white">
      {/* Level + status */}
      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex rounded-full border border-white/10 bg-black/40 p-1" role="group" aria-label="Difficulty">
          {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => startGame(d)}
              aria-pressed={difficulty === d}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition-colors",
                difficulty === d ? "bg-amber-400 text-black" : "text-white/70 hover:text-white"
              )}
            >
              {d}
            </button>
          ))}
        </div>
        <div className="text-right text-xs tabular-nums text-white/70">
          <div className="font-semibold text-white">{fmt(seconds)}</div>
          <div>Mistakes {mistakes}</div>
        </div>
      </div>

      {/* Board */}
      <div
        tabIndex={0}
        onKeyDown={onKeyDown}
        role="grid"
        aria-label="Sudoku board"
        className="grid aspect-square w-full grid-cols-9 overflow-hidden rounded-xl border-2 border-zinc-200 bg-zinc-100 text-zinc-900 shadow-xl outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
      >
        {values.map((v, i) => {
          const isSel = selected === i;
          const related = selected !== null && !isSel && (PEERS[selected].includes(i));
          const sameVal = selVal !== 0 && v === selVal && !isSel;
          const wrong = conflicts.has(i);
          return (
            <button
              key={i}
              type="button"
              role="gridcell"
              aria-label={`Row ${row(i) + 1}, column ${col(i) + 1}${v ? `, ${v}` : ", empty"}`}
              onClick={() => setSelected(i)}
              className={cn(
                "relative flex aspect-square items-center justify-center border border-zinc-300 text-[clamp(1rem,5.5vw,1.6rem)] leading-none transition-colors",
                col(i) % 3 === 2 && col(i) !== 8 && "border-r-2 border-r-zinc-700",
                row(i) % 3 === 2 && row(i) !== 8 && "border-b-2 border-b-zinc-700",
                related && "bg-amber-100",
                sameVal && "bg-amber-200",
                isSel && "bg-amber-300",
                given(i) ? "font-bold text-zinc-900" : "font-medium text-blue-700",
                wrong && "text-red-600"
              )}
            >
              {v ? (
                v
              ) : notes[i]?.length ? (
                <span className="grid h-full w-full grid-cols-3 p-px text-[clamp(0.4rem,2vw,0.65rem)] font-medium leading-none text-zinc-500">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                    <span key={n} className="flex items-center justify-center">{notes[i].includes(n) ? n : ""}</span>
                  ))}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {won ? (
        <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-5 text-center">
          <Trophy className="mx-auto h-8 w-8 text-amber-400" />
          <p className="mt-2 text-lg font-bold">Solved in {fmt(seconds)}</p>
          <p className="text-xs text-white/60">
            {mistakes} {mistakes === 1 ? "mistake" : "mistakes"}, {hints} {hints === 1 ? "hint" : "hints"}
          </p>
          <button
            type="button"
            onClick={() => startGame(difficulty)}
            className="mt-4 inline-flex h-10 items-center gap-2 rounded-full bg-amber-400 px-5 text-sm font-semibold text-black hover:bg-amber-300"
          >
            <RotateCcw className="h-4 w-4" /> Play again
          </button>
        </div>
      ) : (
        <>
          {/* Tools */}
          <div className="grid grid-cols-4 gap-2">
            <ToolBtn label="Notes" active={pencil} onClick={() => setPencil((p) => !p)} icon={<PencilLine className="h-4 w-4" />} />
            <ToolBtn label="Erase" onClick={erase} icon={<Eraser className="h-4 w-4" />} />
            <ToolBtn label="Hint" onClick={hint} icon={<Lightbulb className="h-4 w-4" />} />
            <ToolBtn label="New" onClick={() => startGame(difficulty)} icon={<RotateCcw className="h-4 w-4" />} />
          </div>

          {/* Number pad */}
          <div className="grid grid-cols-9 gap-1.5">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <button
                key={n}
                type="button"
                disabled={counts[n] >= 9}
                onClick={() => place(n)}
                className="flex aspect-[3/4] flex-col items-center justify-center rounded-lg bg-white/10 text-lg font-bold text-white transition-colors hover:bg-white/20 disabled:opacity-25"
              >
                {n}
                <span className="text-[9px] font-normal text-white/50">{9 - counts[n]}</span>
              </button>
            ))}
          </div>
          <p className="text-center text-[11px] text-white/45">
            Coins on completion: {COINS[difficulty]} (1 less per hint). Keyboard: 1-9, arrows, N for notes.
          </p>
        </>
      )}
    </div>
  );
}

const ToolBtn = ({ label, icon, onClick, active }: { label: string; icon: React.ReactNode; onClick: () => void; active?: boolean }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={cn(
      "flex h-12 flex-col items-center justify-center gap-0.5 rounded-xl border text-[11px] font-semibold transition-colors",
      active ? "border-amber-400 bg-amber-400 text-black" : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
    )}
  >
    {icon}
    {label}
  </button>
);
