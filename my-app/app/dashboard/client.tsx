"use client"

import { DollarSign, BedDouble, Package, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { formatMoney } from "@/lib/utils"

function StatCard({ label, value, icon, highlight = false, sub }: {
  label: string; value: string | number; icon: React.ReactNode;
  highlight?: boolean; sub?: string
}) {
  return (
    <div className={`rounded-md border p-5 flex items-center gap-4 bg-white shadow-sm transition-shadow hover:shadow-md ${highlight ? "border-amber-200 ring-1 ring-amber-100" : "border-zinc-100"}`}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${highlight ? "bg-amber-50" : "bg-zinc-50"}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">{label}</p>
        <p className={`text-md sm:text-lg md:text-2xl font-bold font-mono mt-0.5 truncate ${highlight ? "text-amber-600" : "text-zinc-800"}`}>{value}</p>
        {sub && <p className="text-xs text-zinc-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export function DashboardClient({ stats, role }: { stats: any; role: string }) {
  const isAdmin = role === "ADMIN" || role === "DG"

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl font-bold text-zinc-900">Tableau de bord</h1>
        <p className="text-zinc-500 mt-1">
          {isAdmin ? "Vue globale de l'établissement" : "Vos performances du mois"}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="CA du mois"
          value={formatMoney(stats.totalRevenueMonth)}
          icon={<TrendingUp size={18} className="text-amber-500" />}
          highlight
        />
        <StatCard
          label="Séjours du mois"
          value={stats.totalEntriesMonth}
          icon={<BedDouble size={18} className="text-zinc-400" />}
        />
        <StatCard
          label="Recettes"
          value={formatMoney(stats.recettes)}
          icon={<ArrowUpRight size={18} className="text-emerald-500" />}
          sub="mouvements de caisse"
        />
        <StatCard
          label="Dépenses"
          value={formatMoney(stats.depenses)}
          icon={<ArrowDownRight size={18} className="text-rose-400" />}
          sub="mouvements de caisse"
        />
      </div>

      {/* Admin/DG: Table par réceptionniste */}
      {isAdmin && stats.revenueByUser.length > 0 && (
        <div className="card-base">
          <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
            <h2 className="font-bold text-zinc-800">Performance par réceptionniste — Mois en cours</h2>
            <span className="text-xs bg-zinc-100 text-zinc-500 font-semibold px-2 py-1 rounded-full">
              {stats.revenueByUser.length} réceptionniste(s)
            </span>
          </div>
          <table className="w-full text-sm">
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
      )}

      {/* Alertes stock */}
      <div className="card-base card-body">
        <div className="flex items-center gap-2 mb-1">
          <Package size={16} className="text-zinc-400" />
          <h2 className="font-bold text-zinc-800 text-sm">Catalogue de produits</h2>
        </div>
        <p className="text-zinc-400 text-sm">{stats.productCount} produit(s) référencé(s) au catalogue</p>
      </div>
    </div>
  )
}
