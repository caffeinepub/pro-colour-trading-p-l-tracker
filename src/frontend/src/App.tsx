import { Toaster } from "@/components/ui/sonner";
import {
  Activity,
  BarChart3,
  Calendar,
  Loader2,
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Stats, Trade } from "./backend.d.ts";
import { useActor } from "./hooks/useActor";

// ── Helpers ─────────────────────────────────────────────────────────────────

const formatINR = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

const todayISO = () => new Date().toISOString().split("T")[0];

const currentMonthPrefix = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const formatTime = (timestamp: bigint) => {
  const ms = Number(timestamp) / 1_000_000;
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) return "--:--";
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const getNoteDotColor = (note: string): string => {
  const lower = note.toLowerCase();
  if (lower.includes("red")) return "#ef4444";
  if (lower.includes("green")) return "#10b981";
  if (lower.includes("blue")) return "#3b82f6";
  if (lower.includes("yellow") || lower.includes("gold")) return "#f59e0b";
  if (lower.includes("orange")) return "#f97316";
  if (lower.includes("white")) return "#f1f5f9";
  if (lower.includes("black")) return "#6b7280";
  return "#8b5cf6";
};

type ViewMode = "daily" | "monthly";

// ── Empty Stats ──────────────────────────────────────────────────────────────

const EMPTY_STATS: Stats = {
  totalLosses: 0,
  lossCount: BigInt(0),
  consecutiveLosses: BigInt(0),
  totalWins: 0,
  winCount: BigInt(0),
  netPL: 0,
};

// ── Signal Logic ─────────────────────────────────────────────────────────────

type SignalState = "stop" | "profit" | "neutral";

function getSignalState(stats: Stats): SignalState {
  if (Number(stats.consecutiveLosses) >= 3 || stats.netPL <= -2000) {
    return "stop";
  }
  if (stats.netPL > 0) return "profit";
  return "neutral";
}

// ── Video Background ─────────────────────────────────────────────────────────

function VideoBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      <video
        autoPlay
        muted
        loop
        playsInline
        className="w-full h-full object-cover"
        style={{ opacity: 0.5 }}
      >
        <source
          src="https://assets.mixkit.co/videos/preview/mixkit-technology-circuit-board-4825-large.mp4"
          type="video/mp4"
        />
      </video>
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(5,5,15,0.65) 0%, rgba(5,5,15,0.55) 50%, rgba(5,5,15,0.75) 100%)",
        }}
      />
    </div>
  );
}

// ── Header ───────────────────────────────────────────────────────────────────

function Header({ signal }: { signal: SignalState }) {
  const glowStyle =
    signal === "stop"
      ? {
          boxShadow:
            "0 0 30px rgba(239,68,68,0.8), 0 0 60px rgba(239,68,68,0.3)",
        }
      : signal === "profit"
        ? {
            boxShadow:
              "0 0 30px rgba(16,185,129,0.8), 0 0 60px rgba(16,185,129,0.3)",
          }
        : { boxShadow: "0 0 20px rgba(245,158,11,0.5)" };

  const accentColor =
    signal === "profit" ? "#10b981" : signal === "stop" ? "#ef4444" : "#f59e0b";
  const accentBg =
    signal === "profit"
      ? "rgba(16,185,129,0.2)"
      : signal === "stop"
        ? "rgba(239,68,68,0.2)"
        : "rgba(245,158,11,0.2)";
  const badgeBg =
    signal === "profit"
      ? "rgba(16,185,129,0.15)"
      : signal === "stop"
        ? "rgba(239,68,68,0.15)"
        : "rgba(245,158,11,0.15)";
  const badgeBorder =
    signal === "profit"
      ? "rgba(16,185,129,0.3)"
      : signal === "stop"
        ? "rgba(239,68,68,0.3)"
        : "rgba(245,158,11,0.3)";

  return (
    <header
      className="relative z-20 glass-card-deep transition-all duration-500"
      style={glowStyle}
    >
      <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-500"
            style={{
              background: accentBg,
              boxShadow: `0 0 12px ${accentColor}80`,
            }}
          >
            <Activity
              className="w-5 h-5 transition-colors duration-500"
              style={{ color: accentColor }}
            />
          </div>
          <div>
            <h1 className="font-sora font-bold text-white text-base leading-tight tracking-tight">
              Pro Colour Trader
            </h1>
            <p className="text-white/50 text-xs font-jakarta">
              P&amp;L Tracker
            </p>
          </div>
        </div>

        <div
          className="px-3 py-1 rounded-full text-xs font-sora font-semibold tracking-widest uppercase transition-all duration-500"
          style={{
            background: badgeBg,
            color: accentColor,
            border: `1px solid ${badgeBorder}`,
          }}
        >
          {signal === "stop" ? "STOP" : "LIVE"}
        </div>
      </div>
    </header>
  );
}

// ── Signal Bar ────────────────────────────────────────────────────────────────

function SignalBar({ stats }: { stats: Stats }) {
  const signal = getSignalState(stats);

  if (signal === "stop") {
    return (
      <div
        className="relative z-20 px-4 py-3 text-center text-sm font-sora font-bold text-white animate-pulse-red"
        style={{
          background: "rgba(239,68,68,0.25)",
          borderBottom: "1px solid rgba(239,68,68,0.4)",
        }}
      >
        🛑 STOP / COOLDOWN — Take a break
        <span className="ml-2 text-white/60 text-xs font-normal font-jakarta">
          {Number(stats.consecutiveLosses) >= 3
            ? `${stats.consecutiveLosses} consecutive losses`
            : "Net P&L below -₹2000"}
        </span>
      </div>
    );
  }

  if (signal === "profit") {
    return (
      <div
        className="relative z-20 px-4 py-3 text-center text-sm font-sora font-bold text-white animate-pulse-green"
        style={{
          background: "rgba(16,185,129,0.2)",
          borderBottom: "1px solid rgba(16,185,129,0.35)",
        }}
      >
        ✅ PROFIT GO — Keep it up!
      </div>
    );
  }

  return (
    <div
      className="relative z-20 px-4 py-3 text-center text-sm font-sora font-bold text-white"
      style={{
        background: "rgba(245,158,11,0.15)",
        borderBottom: "1px solid rgba(245,158,11,0.3)",
      }}
    >
      ⚡ NEUTRAL — Stay focused
    </div>
  );
}

// ── P&L Summary Card ─────────────────────────────────────────────────────────

function PLSummaryCard({
  stats,
  signal,
}: {
  stats: Stats;
  signal: SignalState;
}) {
  const isProfit = stats.netPL > 0;
  const isLoss = stats.netPL < 0;
  const plColor = isProfit ? "#10b981" : isLoss ? "#ef4444" : "#f59e0b";
  const plGlow = isProfit
    ? "0 0 20px rgba(16,185,129,0.6)"
    : isLoss
      ? "0 0 20px rgba(239,68,68,0.6)"
      : "0 0 20px rgba(245,158,11,0.5)";
  const cardGlow =
    signal === "profit"
      ? "0 0 40px rgba(16,185,129,0.2), 0 8px 32px rgba(0,0,0,0.4)"
      : signal === "stop"
        ? "0 0 40px rgba(239,68,68,0.2), 0 8px 32px rgba(0,0,0,0.4)"
        : "0 8px 32px rgba(0,0,0,0.4)";

  return (
    <div
      className="glass-card rounded-2xl p-6 transition-all duration-500"
      style={{ boxShadow: cardGlow }}
    >
      <div className="text-center mb-6">
        <p className="text-white/40 text-xs font-jakarta uppercase tracking-widest mb-2">
          Net P&amp;L
        </p>
        <div
          className="font-trading animate-number-pop"
          style={{
            fontSize: "clamp(2.5rem, 8vw, 4rem)",
            fontWeight: 1000,
            lineHeight: 1,
            color: plColor,
            textShadow: plGlow,
            letterSpacing: "-0.03em",
          }}
        >
          {stats.netPL >= 0 ? "+" : ""}
          {formatINR(stats.netPL)}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div
          className="rounded-xl p-4 text-center"
          style={{
            background: "rgba(16,185,129,0.1)",
            border: "1px solid rgba(16,185,129,0.25)",
          }}
        >
          <div className="flex items-center justify-center gap-1.5 mb-2">
            <TrendingUp className="w-4 h-4" style={{ color: "#10b981" }} />
            <span className="text-xs font-jakarta text-white/60 uppercase tracking-wide">
              Wins
            </span>
          </div>
          <p
            className="font-trading font-bold text-xl"
            style={{ color: "#10b981" }}
          >
            {Number(stats.winCount)}
          </p>
          <p className="text-white/50 text-xs font-jakarta mt-1">
            {formatINR(stats.totalWins)}
          </p>
        </div>

        <div
          className="rounded-xl p-4 text-center"
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.25)",
          }}
        >
          <div className="flex items-center justify-center gap-1.5 mb-2">
            <TrendingDown className="w-4 h-4" style={{ color: "#ef4444" }} />
            <span className="text-xs font-jakarta text-white/60 uppercase tracking-wide">
              Losses
            </span>
          </div>
          <p
            className="font-trading font-bold text-xl"
            style={{ color: "#ef4444" }}
          >
            {Number(stats.lossCount)}
          </p>
          <p className="text-white/50 text-xs font-jakarta mt-1">
            {formatINR(stats.totalLosses)}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── View Toggle ───────────────────────────────────────────────────────────────

function ViewToggle({
  view,
  onChange,
}: {
  view: ViewMode;
  onChange: (v: ViewMode) => void;
}) {
  return (
    <div
      className="flex p-1 rounded-2xl"
      style={{
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.1)",
      }}
    >
      {(["daily", "monthly"] as ViewMode[]).map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-sora font-semibold transition-all duration-200 active:scale-95"
          style={
            view === v
              ? {
                  background: "rgba(16,185,129,0.2)",
                  color: "#10b981",
                  boxShadow: "0 0 12px rgba(16,185,129,0.3)",
                  border: "1px solid rgba(16,185,129,0.35)",
                }
              : { color: "rgba(255,255,255,0.5)" }
          }
        >
          {v === "daily" ? (
            <Calendar className="w-3.5 h-3.5" />
          ) : (
            <BarChart3 className="w-3.5 h-3.5" />
          )}
          {v.charAt(0).toUpperCase() + v.slice(1)}
        </button>
      ))}
    </div>
  );
}

// ── Trade Card ────────────────────────────────────────────────────────────────

function TradeCard({
  trade,
  onDelete,
}: {
  trade: Trade;
  onDelete: (id: string) => void;
}) {
  const isWin = trade.tradeType === "win";
  const dotColor = getNoteDotColor(trade.note);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = () => {
    setDeleting(true);
    onDelete(trade.id);
  };

  return (
    <div className="glass-card rounded-xl p-4 flex items-center gap-3 animate-ticker-in transition-all duration-200 hover:bg-white/[0.09]">
      <div
        className="w-3 h-3 rounded-full flex-shrink-0"
        style={{ backgroundColor: dotColor, boxShadow: `0 0 6px ${dotColor}` }}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="font-trading font-bold text-base"
            style={{ color: isWin ? "#10b981" : "#ef4444" }}
          >
            {isWin ? "+" : "-"}
            {formatINR(trade.amount)}
          </span>
          <span
            className="text-xs px-1.5 py-0.5 rounded font-sora font-semibold uppercase tracking-wide"
            style={
              isWin
                ? { background: "rgba(16,185,129,0.15)", color: "#10b981" }
                : { background: "rgba(239,68,68,0.15)", color: "#ef4444" }
            }
          >
            {isWin ? "WIN" : "LOSS"}
          </span>
        </div>
        {trade.note && (
          <p className="text-white/55 text-xs font-jakarta mt-0.5 truncate">
            {trade.note}
          </p>
        )}
      </div>

      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <span className="text-white/35 text-xs font-trading">
          {formatTime(trade.timestamp)}
        </span>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-100 active:scale-90 hover:bg-red-500/20 disabled:opacity-50"
          aria-label="Delete trade"
        >
          {deleting ? (
            <Loader2 className="w-3.5 h-3.5 text-white/40 animate-spin" />
          ) : (
            <Trash2 className="w-3.5 h-3.5 text-white/35 hover:text-red-400 transition-colors" />
          )}
        </button>
      </div>
    </div>
  );
}

// ── Live Tape ─────────────────────────────────────────────────────────────────

function LiveTape({
  trades,
  onDelete,
}: {
  trades: Trade[];
  onDelete: (id: string) => void;
}) {
  if (trades.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <Activity className="w-6 h-6 text-white/20" />
        </div>
        <p className="text-white/40 font-sora font-medium text-sm">
          No trades logged yet
        </p>
        <p className="text-white/25 text-xs font-jakarta mt-1">
          Tap the + button to record your first trade
        </p>
      </div>
    );
  }

  const sorted = [...trades].sort(
    (a, b) => Number(b.timestamp) - Number(a.timestamp),
  );

  return (
    <div className="space-y-2">
      {sorted.map((trade) => (
        <TradeCard key={trade.id} trade={trade} onDelete={onDelete} />
      ))}
    </div>
  );
}

// ── Bottom Sheet ─────────────────────────────────────────────────────────────

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (
    amount: number,
    note: string,
    type: "win" | "loss",
  ) => Promise<void>;
  submitting: boolean;
}

function BottomSheet({
  open,
  onClose,
  onSubmit,
  submitting,
}: BottomSheetProps) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [type, setType] = useState<"win" | "loss">("win");
  const amountRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => amountRef.current?.focus(), 350);
      return () => clearTimeout(timer);
    }
    setAmount("");
    setNote("");
    setType("win");
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number.parseFloat(amount);
    if (Number.isNaN(num) || num <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    await onSubmit(num, note.trim(), type);
  };

  const handleAmountFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.border = `1px solid ${
      type === "win" ? "rgba(16,185,129,0.5)" : "rgba(239,68,68,0.5)"
    }`;
  };

  const handleAmountBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.border = "1px solid rgba(255,255,255,0.12)";
  };

  const handleNoteFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.border = "1px solid rgba(255,255,255,0.3)";
  };

  const handleNoteBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.border = "1px solid rgba(255,255,255,0.12)";
  };

  const handleBackdropKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        role="button"
        tabIndex={-1}
        aria-label="Close"
        className={`fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        onKeyDown={handleBackdropKeyDown}
      />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 transition-transform duration-500"
        style={{
          transform: open ? "translateY(0)" : "translateY(100%)",
          transitionTimingFunction: open
            ? "cubic-bezier(0.34, 1.56, 0.64, 1)"
            : "ease-in",
        }}
      >
        <div
          className="glass-card-deep rounded-t-3xl px-5 pt-3 pb-8"
          style={{ borderTop: "1px solid rgba(255,255,255,0.12)" }}
        >
          {/* Drag handle */}
          <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-5" />

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-sora font-bold text-white text-lg">
              Log Trade
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/10 hover:bg-white/15 transition-all active:scale-90"
            >
              <X className="w-4 h-4 text-white/70" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Win/Loss toggle */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType("win")}
                className="py-3 rounded-2xl font-sora font-bold text-sm flex items-center justify-center gap-2 transition-all duration-150 active:scale-95"
                style={
                  type === "win"
                    ? {
                        background: "rgba(16,185,129,0.25)",
                        color: "#10b981",
                        border: "1.5px solid rgba(16,185,129,0.5)",
                        boxShadow: "0 0 16px rgba(16,185,129,0.3)",
                      }
                    : {
                        background: "rgba(255,255,255,0.05)",
                        color: "rgba(255,255,255,0.4)",
                        border: "1.5px solid rgba(255,255,255,0.1)",
                      }
                }
              >
                <TrendingUp className="w-4 h-4" />
                WIN
              </button>
              <button
                type="button"
                onClick={() => setType("loss")}
                className="py-3 rounded-2xl font-sora font-bold text-sm flex items-center justify-center gap-2 transition-all duration-150 active:scale-95"
                style={
                  type === "loss"
                    ? {
                        background: "rgba(239,68,68,0.25)",
                        color: "#ef4444",
                        border: "1.5px solid rgba(239,68,68,0.5)",
                        boxShadow: "0 0 16px rgba(239,68,68,0.3)",
                      }
                    : {
                        background: "rgba(255,255,255,0.05)",
                        color: "rgba(255,255,255,0.4)",
                        border: "1.5px solid rgba(255,255,255,0.1)",
                      }
                }
              >
                <TrendingDown className="w-4 h-4" />
                LOSS
              </button>
            </div>

            {/* Amount */}
            <div>
              <label
                htmlFor="trade-amount"
                className="block text-xs font-sora font-medium text-white/50 uppercase tracking-wide mb-1.5"
              >
                Amount (₹)
              </label>
              <input
                id="trade-amount"
                ref={amountRef}
                type="number"
                inputMode="decimal"
                min="1"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                required
                className="w-full rounded-xl px-4 py-3 font-trading font-bold text-white placeholder-white/20 transition-all duration-200 focus:outline-none"
                style={{
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  fontSize: "1.5rem",
                }}
                onFocus={handleAmountFocus}
                onBlur={handleAmountBlur}
              />
            </div>

            {/* Note */}
            <div>
              <label
                htmlFor="trade-note"
                className="block text-xs font-sora font-medium text-white/50 uppercase tracking-wide mb-1.5"
              >
                Note
              </label>
              <input
                id="trade-note"
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Red Candle, Green Break"
                className="w-full rounded-xl px-4 py-3 font-jakarta text-white placeholder-white/25 transition-all duration-200 focus:outline-none"
                style={{
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
                onFocus={handleNoteFocus}
                onBlur={handleNoteBlur}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting || !amount}
              className="w-full py-4 rounded-2xl font-sora font-bold text-base transition-all duration-150 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 text-white"
              style={
                type === "win"
                  ? {
                      background: "rgba(16,185,129,0.9)",
                      boxShadow: "0 0 20px rgba(16,185,129,0.4)",
                    }
                  : {
                      background: "rgba(239,68,68,0.9)",
                      boxShadow: "0 0 20px rgba(239,68,68,0.4)",
                    }
              }
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Activity className="w-4 h-4" />
              )}
              {submitting ? "Logging..." : "Log Trade"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

// ── FAB ───────────────────────────────────────────────────────────────────────

function FAB({
  onClick,
  signal,
}: { onClick: () => void; signal: SignalState }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-6 right-5 z-30 w-16 h-16 rounded-3xl flex items-center justify-center transition-all duration-200 active:scale-95 hover:scale-105"
      style={{
        background:
          signal === "stop" ? "rgba(239,68,68,0.9)" : "rgba(16,185,129,0.9)",
        boxShadow:
          signal === "stop"
            ? "0 0 24px rgba(239,68,68,0.6), 0 8px 24px rgba(0,0,0,0.4)"
            : "0 0 24px rgba(16,185,129,0.6), 0 8px 24px rgba(0,0,0,0.4)",
      }}
      aria-label="Add trade"
    >
      <Plus className="w-7 h-7 text-white" strokeWidth={2.5} />
    </button>
  );
}

// ── Loading Skeleton ──────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="glass-card rounded-2xl p-6">
        <div className="h-4 bg-white/10 rounded mb-4 w-24 mx-auto" />
        <div className="h-14 bg-white/10 rounded mb-4 w-48 mx-auto" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-20 bg-white/10 rounded-xl" />
          <div className="h-20 bg-white/10 rounded-xl" />
        </div>
      </div>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="glass-card rounded-xl p-4 flex items-center gap-3"
        >
          <div className="w-3 h-3 rounded-full bg-white/10" />
          <div className="flex-1">
            <div className="h-4 bg-white/10 rounded mb-2 w-24" />
            <div className="h-3 bg-white/10 rounded w-36" />
          </div>
          <div className="w-7 h-7 bg-white/10 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const { actor, isFetching: actorLoading } = useActor();

  const [trades, setTrades] = useState<Trade[]>([]);
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("daily");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    if (!actor) return;
    try {
      const [allTrades, freshStats] = await Promise.all([
        actor.getTrades(),
        actor.getStats(),
      ]);
      setTrades(allTrades);
      setStats(freshStats);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load data. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, [actor]);

  useEffect(() => {
    if (actor && !actorLoading) {
      loadData();
    }
  }, [actor, actorLoading, loadData]);

  const filteredTrades = (() => {
    if (viewMode === "daily") {
      const today = todayISO();
      return trades.filter((t) => t.date === today);
    }
    const prefix = currentMonthPrefix();
    return trades.filter((t) => t.date.startsWith(prefix));
  })();

  const signal = getSignalState(stats);

  const handleAddTrade = async (
    amount: number,
    note: string,
    type: "win" | "loss",
  ) => {
    if (!actor) return;
    setSubmitting(true);
    try {
      await actor.addTrade(amount, note, type, todayISO());
      toast.success(
        `Trade logged: ${type === "win" ? "+" : "-"}${formatINR(amount)}`,
      );
      setSheetOpen(false);
      await loadData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to log trade. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTrade = async (id: string) => {
    if (!actor) return;
    try {
      await actor.deleteTrade(id);
      toast.success("Trade removed");
      await loadData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete trade.");
    }
  };

  const isAppLoading = loading || actorLoading;

  return (
    <div className="relative min-h-screen flex flex-col">
      <VideoBackground />

      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "rgba(20,20,35,0.95)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "#fff",
          },
        }}
      />

      <div className="relative z-10 flex flex-col min-h-screen">
        <Header signal={signal} />
        <SignalBar stats={stats} />

        <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-5 pb-28 space-y-4">
          {isAppLoading ? (
            <LoadingSkeleton />
          ) : (
            <>
              <PLSummaryCard stats={stats} signal={signal} />
              <ViewToggle view={viewMode} onChange={setViewMode} />

              <div className="flex items-center justify-between px-1">
                <h2 className="font-sora font-semibold text-white/70 text-sm uppercase tracking-widest">
                  Live Tape
                </h2>
                <span className="text-white/35 text-xs font-trading">
                  {filteredTrades.length} trade
                  {filteredTrades.length !== 1 ? "s" : ""}
                </span>
              </div>

              <LiveTape trades={filteredTrades} onDelete={handleDeleteTrade} />
            </>
          )}
        </main>

        <footer className="relative z-10 text-center py-4 text-white/20 text-xs font-jakarta pb-24">
          © {new Date().getFullYear()}.{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white/40 transition-colors"
          >
            Built with ♥ using caffeine.ai
          </a>
        </footer>
      </div>

      <FAB onClick={() => setSheetOpen(true)} signal={signal} />

      <BottomSheet
        open={sheetOpen}
        onClose={() => !submitting && setSheetOpen(false)}
        onSubmit={handleAddTrade}
        submitting={submitting}
      />
    </div>
  );
}
