import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency, formatDate } from "@/utils";

function parseDateSafe(value) {
  const d = new Date(value);
  return Number.isFinite(d.getTime()) ? d : null;
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatShortDayLabel(isoOrDate) {
  const d = typeof isoOrDate === "string" ? parseDateSafe(isoOrDate) : isoOrDate;
  if (!d) return "-";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return startOfDay(d);
}

function getRangeStart(range) {
  if (range === "7d") return daysAgo(6);
  if (range === "30d") return daysAgo(29);
  if (range === "90d") return daysAgo(89);
  return null; // all
}

function buildSeries(payments, range) {
  const start = getRangeStart(range);
  const rows = (payments || [])
    .map((p) => {
      const d = parseDateSafe(p.created_date);
      return {
        ...p,
        __date: d,
        __amount: Number(p.amount || 0),
      };
    })
    .filter((p) => p.__date && Number.isFinite(p.__amount));

  const filtered = start ? rows.filter((p) => startOfDay(p.__date) >= start) : rows;

  // group by day
  const byDay = new Map();
  for (const p of filtered) {
    const day = startOfDay(p.__date).toISOString();
    const prev = byDay.get(day) || { day, revenue: 0, count: 0 };
    prev.revenue += p.__amount;
    prev.count += 1;
    byDay.set(day, prev);
  }

  const data = Array.from(byDay.values())
    .sort((a, b) => new Date(a.day) - new Date(b.day))
    .map((row) => ({
      ...row,
      label: formatShortDayLabel(row.day),
    }));

  // cumulative line for nicer "growth" feeling
  let acc = 0;
  const withAcc = data.map((row) => {
    acc += row.revenue;
    return { ...row, cumulative: acc };
  });

  return { points: withAcc, filteredPayments: filtered };
}

export default function RevenueChart({ payments, onDeletePayment }) {
  const [range, setRange] = useState("30d"); // 7d | 30d | 90d | all

  const { points, filteredPayments } = useMemo(() => buildSeries(payments, range), [payments, range]);

  const total = useMemo(() => filteredPayments.reduce((sum, p) => sum + (p.__amount || 0), 0), [filteredPayments]);
  const count = filteredPayments.length;

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-4">
        <div>
          <h3 className="text-xl font-semibold">Lucro (receita)</h3>
          <p className="text-slate-400 text-sm mt-1">
            {range === "all" ? "Todo período" : `Últimos ${range.replace("d", "")} dias`} • {count} pagamento(s) •{" "}
            <span className="text-slate-200 font-semibold">{formatCurrency(total)}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <RangeButton value="7d" current={range} onClick={setRange}>
            7d
          </RangeButton>
          <RangeButton value="30d" current={range} onClick={setRange}>
            30d
          </RangeButton>
          <RangeButton value="90d" current={range} onClick={setRange}>
            90d
          </RangeButton>
          <RangeButton value="all" current={range} onClick={setRange}>
            Tudo
          </RangeButton>
        </div>
      </div>

      <div className="h-72 w-full">
        {points.length === 0 ? (
          <div className="h-full rounded-2xl border border-slate-800 bg-slate-950 flex items-center justify-center text-slate-500">
            Sem dados no período selecionado.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={points} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#07a2eb" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#07a2eb" stopOpacity={0.02} />
                </linearGradient>
              </defs>

              <CartesianGrid stroke="rgba(148,163,184,0.15)" strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tick={{ fill: "rgba(226,232,240,0.75)", fontSize: 12 }}
                axisLine={{ stroke: "rgba(148,163,184,0.25)" }}
                tickLine={{ stroke: "rgba(148,163,184,0.25)" }}
              />
              <YAxis
                tickFormatter={(v) => formatCurrency(v)}
                tick={{ fill: "rgba(226,232,240,0.75)", fontSize: 12 }}
                axisLine={{ stroke: "rgba(148,163,184,0.25)" }}
                tickLine={{ stroke: "rgba(148,163,184,0.25)" }}
                width={90}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area
                type="monotone"
                dataKey="revenue"
                name="Receita/dia"
                stroke="#55b7ff"
                strokeWidth={2}
                fill="url(#revFill)"
                activeDot={{ r: 5 }}
              />
              <Area type="monotone" dataKey="cumulative" name="Acumulado" stroke="#0684c0" strokeWidth={2} fillOpacity={0} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-400">Pagamentos no período</p>
          <p className="text-xs text-slate-500">Excluir remove do gráfico e do armazenamento local</p>
        </div>

        <div className="mt-3 space-y-2 max-h-56 overflow-auto pr-1">
          {filteredPayments
            .slice()
            .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
            .map((p) => (
              <div key={p.id} className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{p.user_email}</p>
                  <p className="text-xs text-slate-400 truncate">
                    {p.plan_name} • {p.payment_method} • {formatDate(p.created_date)}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <p className="text-sm font-semibold">{formatCurrency(Number(p.amount || 0))}</p>
                  <button
                    type="button"
                    onClick={() => onDeletePayment?.(p.id)}
                    className="rounded-xl bg-rose-600/20 hover:bg-rose-600/30 px-3 py-2 text-xs font-semibold"
                    title="Excluir pagamento"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

function RangeButton({ value, current, onClick, children }) {
  const active = value === current;
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={[
        "px-3 py-2 rounded-xl text-sm font-semibold border",
        active ? "bg-sky-600 border-sky-500 text-white" : "bg-slate-950 border-slate-800 text-slate-200 hover:border-sky-500",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null;

  const revenue = payload.find((p) => p.dataKey === "revenue")?.value ?? 0;
  const cumulative = payload.find((p) => p.dataKey === "cumulative")?.value ?? 0;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3">
      <p className="text-sm font-semibold text-slate-200">{label}</p>
      <p className="text-xs text-slate-400 mt-1">Receita: {formatCurrency(revenue)}</p>
      <p className="text-xs text-slate-400">Acumulado: {formatCurrency(cumulative)}</p>
    </div>
  );
}
