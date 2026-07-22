"use client"

import Link from "next/link"
import {
  BedDouble, DoorOpen, TrendingUp, TrendingDown, AlertTriangle,
  ShoppingCart, Wallet, ClipboardList, Users, Settings, Receipt, ArrowRight
} from "lucide-react"
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, BarChart, Bar,
} from "recharts"
import { formatMoney } from "@/lib/utils"

const COLORS = { occupied: "#d97706", free: "#e4e4e7" }

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`card-base card-body ${className}`}>{children}</div>
}

function StatCard({ label, value, icon: Icon, tone = "zinc" }: any) {
  const toneMap: Record<string, string> = {
    zinc: "bg-zinc-100 text-zinc-600",
    amber: "bg-amber-50 text-amber-600",
    emerald: "bg-emerald-50 text-emerald-600",
    rose: "bg-rose-50 text-rose-600",
  }
  return (
    <Card className="flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${toneMap[tone]}`}>
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider truncate">{label}</p>
        <p className="text-xl font-bold font-mono text-zinc-800 truncate">{value}</p>
      </div>
    </Card>
  )
}

function RevenueTrendChart({ data }: { data: { date: string; revenue: number }[] }) {
  const chartData = data.map(d => ({ ...d, label: d.date.slice(5).replace("-", "/") }))
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#d97706" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#a1a1aa" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#a1a1aa" }} axisLine={false} tickLine={false} width={44}
          tickFormatter={(v) => v >= 1000 ? `${Math.round(v / 1000)}k` : v} />
        <Tooltip
          formatter={(v: any) => [formatMoney(Number(v) || 0), "Revenu"]}
          contentStyle={{ borderRadius: 10, border: "1px solid #e4e4e7", fontSize: 12 }}
        />
        <Area type="monotone" dataKey="revenue" stroke="#d97706" strokeWidth={2} fill="url(#revGradient)" />
      </AreaChart>
    </ResponsiveContainer>
  )
}

function OccupancyChart({ occupancy }: { occupancy: { total: number; occupied: number; free: number } }) {
  const data = [
    { name: "Occupées", value: occupancy.occupied, color: COLORS.occupied },
    { name: "Libres", value: occupancy.free, color: COLORS.free },
  ]
  return (
    <div className="flex items-center gap-4">
      <div className="w-28 h-28 flex-shrink-0 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" innerRadius={34} outerRadius={54} startAngle={90} endAngle={-270} stroke="none">
              {data.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold font-mono text-zinc-800">{occupancy.occupied}</span>
          <span className="text-[10px] text-zinc-400">/ {occupancy.total}</span>
        </div>
      </div>
      <div className="flex flex-col gap-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS.occupied }} />
          <span className="text-zinc-600">{occupancy.occupied} occupée{occupancy.occupied > 1 ? "s" : ""}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS.free }} />
          <span className="text-zinc-600">{occupancy.free} libre{occupancy.free > 1 ? "s" : ""}</span>
        </div>
      </div>
    </div>
  )
}

function RevenueChangeBadge({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-xs text-zinc-400">Pas de données le mois dernier</span>
  const up = pct >= 0
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
      up ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600"
    }`}>
      {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {up ? "+" : ""}{pct.toFixed(1)}% vs mois dernier
    </span>
  )
}

function QuickActions({ role }: { role: string }) {
  const actions =
    role === "RECEPTIONIST"
      ? [
          { href: "/dashboard/registre", label: "Nouveau séjour", icon: Receipt },
          { href: "/dashboard/finances", label: "Mouvement caisse", icon: Wallet },
          { href: "/dashboard/stock", label: "Mouvement stock", icon: ShoppingCart },
        ]
      : [
          { href: "/dashboard/bilans", label: "Bilans & remises", icon: ClipboardList },
          { href: "/dashboard/users", label: "Équipe", icon: Users },
          ...(role === "ADMIN" ? [{ href: "/dashboard/params", label: "Paramètres", icon: Settings }] : []),
        ]

  return (
    <div className="flex flex-wrap gap-3">
      {actions.map((a) => (
        <Link
          key={a.href}
          href={a.href}
          className="flex-1 min-w-[160px] flex items-center gap-3 px-4 py-3.5 rounded-md border border-zinc-100 bg-white hover:border-amber-200 hover:bg-amber-50/40 transition-colors group"
        >
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <a.icon size={16} />
          </div>
          <span className="text-sm font-semibold text-zinc-700 flex-1">{a.label}</span>
          <ArrowRight size={14} className="text-zinc-300 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
        </Link>
      ))}
    </div>
  )
}

export function DashboardClient({ stats, role, liveSummary }: { stats: any; role: string; liveSummary: any }) {
  const isDirection = role === "ADMIN" || role === "DG"

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-zinc-900">Tableau de bord</h1>
        <p className="text-zinc-500 mt-1 text-sm">
          {role === "RECEPTIONIST" ? "Votre activité en un coup d'œil" : "Vue d'ensemble de l'activité"}
        </p>
      </div>

      {/* Alertes stock — visible par tous, données ciblées */}
      {stats.lowStockAlerts.length > 0 && (
        <div className="rounded-md border border-rose-200 bg-rose-50/60 px-5 py-4 flex items-start gap-3">
          <AlertTriangle size={18} className="text-rose-500 flex-shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="font-bold text-rose-700 text-sm">
              {stats.lowStockAlerts.length} produit{stats.lowStockAlerts.length > 1 ? "s" : ""} en stock critique
            </p>
            <p className="text-rose-600/80 text-xs mt-1">
              {stats.lowStockAlerts.map((p: any) => `${p.name} (${p.stock})`).join(" · ")}
            </p>
          </div>
        </div>
      )}

      {/* Cartes stats principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label={role === "RECEPTIONIST" ? "Votre CA (mois)" : "CA total (mois)"}
          value={formatMoney(stats.totalRevenueMonth)}
          icon={Wallet}
          tone="amber"
        />
        <StatCard label="Séjours ce mois" value={stats.totalEntriesMonth} icon={BedDouble} tone="zinc" />
        <StatCard label="Chambres occupées" value={`${stats.occupancy.occupied} / ${stats.occupancy.total}`} icon={DoorOpen} tone="emerald" />
        <StatCard label="Produits en catalogue" value={stats.productCount} icon={ShoppingCart} tone="zinc" />
      </div>

      {/* Raccourcis d'action */}
      <QuickActions role={role} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Tendance des revenus (7 jours) */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-zinc-800 text-sm">Revenus — 7 derniers jours</h2>
            <RevenueChangeBadge pct={stats.revenueChangePct} />
          </div>
          <RevenueTrendChart data={stats.revenueByDay} />
        </Card>

        {/* Occupation en temps réel */}
        <Card>
          <h2 className="font-bold text-zinc-800 text-sm mb-4">Occupation actuelle</h2>
          <OccupancyChart occupancy={stats.occupancy} />
        </Card>
      </div>

      {/* Point du jour en direct — réceptionniste uniquement */}
      {role === "RECEPTIONIST" && liveSummary && (
        <Card>
          <h2 className="font-bold text-zinc-800 text-sm mb-4">Votre journée en cours ({liveSummary.date})</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-zinc-500">Séjours</p>
              <p className="font-mono font-bold text-zinc-800">{liveSummary.entriesCount}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Recettes</p>
              <p className="font-mono font-bold text-emerald-600">{formatMoney(liveSummary.recettes)}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Dépenses</p>
              <p className="font-mono font-bold text-rose-500">{formatMoney(liveSummary.depenses)}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Total attendu</p>
              <p className="font-mono font-bold text-zinc-900">{formatMoney(liveSummary.expectedAmount)}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Vue direction : activité live par réceptionniste + graphique comparatif */}
      {isDirection && stats.receptionistsLiveToday.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-zinc-800 text-sm">Activité du jour par réceptionniste</h2>
            {stats.pendingAccessRequestsCount > 0 && (
              <Link href="/dashboard/users" className="text-xs font-semibold text-amber-600 hover:text-amber-700 inline-flex items-center gap-1">
                {stats.pendingAccessRequestsCount} demande(s) d&apos;accès à traiter <ArrowRight size={12} />
              </Link>
            )}
          </div>
          <ResponsiveContainer width="100%" height={Math.max(160, stats.receptionistsLiveToday.length * 44)}>
            <BarChart data={stats.receptionistsLiveToday} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f4f4f5" />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#a1a1aa" }} axisLine={false} tickLine={false}
                tickFormatter={(v) => v >= 1000 ? `${Math.round(v / 1000)}k` : v} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "#3f3f46" }} axisLine={false} tickLine={false} width={100} />
              <Tooltip
                formatter={(v: any, key: any) =>key === "expectedAmount" ? [formatMoney(Number(v) || 0), "Montant attendu"] : [Number(v) || 0, "Séjours"]}
                contentStyle={{ borderRadius: 10, border: "1px solid #e4e4e7", fontSize: 12 }}
              />
              <Bar dataKey="expectedAmount" fill="#d97706" radius={[0, 4, 4, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Performance mensuelle par réceptionniste (déjà existant) */}
      {isDirection && stats.revenueByUser.length > 0 && (
        <Card className="p-0 overflow-hidden">
          <h2 className="font-bold text-zinc-800 text-sm px-6 pt-5 pb-3">Performance du mois par réceptionniste</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[480px]">
              <thead>
                <tr className="bg-zinc-50 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  <th className="text-left px-6 py-3">Réceptionniste</th>
                  <th className="text-right px-6 py-3">Séjours</th>
                  <th className="text-right px-6 py-3">Revenus générés</th>
                </tr>
              </thead>
              <tbody>
                {stats.revenueByUser.map((u: any, i: number) => (
                  <tr key={i} className="border-t border-zinc-50 hover:bg-zinc-50 transition-colors">
                    <td className="px-6 py-3.5 font-medium text-zinc-800 flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-xs font-bold text-amber-600">
                        {(u.name || "?")[0]}
                      </span>
                      {u.name}
                    </td>
                    <td className="px-6 py-3.5 text-right text-zinc-500 font-mono">{u.entries}</td>
                    <td className="px-6 py-3.5 text-right font-bold font-mono text-zinc-800">{formatMoney(u.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}