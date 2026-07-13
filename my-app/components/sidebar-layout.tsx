"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BedDouble, TrendingUp, Wallet, Wine, Settings,
  ShieldCheck, LogOut, Menu, X, ChevronRight
} from "lucide-react"

interface SidebarLayoutProps {
  user: { name: string; email: string; role: string }
  children: React.ReactNode
}

const NAV_RECEPTION = [
  { href: "/dashboard/reception", label: "Registre", icon: BedDouble },
]

const NAV_ADMIN = [
  { href: "/dashboard/admin", label: "Résumé", icon: TrendingUp },
  { href: "/dashboard/admin?tab=caisse", label: "Caisse", icon: Wallet },
  { href: "/dashboard/admin?tab=stock", label: "Stock boissons", icon: Wine },
  { href: "/dashboard/admin?tab=params", label: "Paramètres", icon: Settings },
  { href: "/dashboard/admin?tab=users", label: "Équipe", icon: ShieldCheck },
]

function NavLink({ href, label, icon: Icon, active }: any) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-[15px] font-medium transition-all ${
        active
          ? "bg-amber-50 text-amber-700 font-semibold"
          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
      }`}
    >
      <Icon size={18} className={active ? "text-amber-600" : "text-zinc-400"} />
      {label}
      {active && <ChevronRight size={14} className="ml-auto text-amber-400" />}
    </Link>
  )
}

export function SidebarLayout({ user, children }: SidebarLayoutProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const isAdmin = user.role === "DG" || user.role === "ADMIN"

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-zinc-100">
        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-amber-100 flex-shrink-0 shadow-sm">
          <img src="/la_revelation_logo.jpg" alt="Logo" className="w-full h-full object-cover" />
        </div>
        <div>
          <p className="text-[11px] font-bold text-amber-600 uppercase tracking-widest leading-none">Motel</p>
          <p className="font-serif text-base font-bold text-zinc-900 leading-snug">La Révélation</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 flex flex-col gap-1 overflow-y-auto">
        {isAdmin && (
          <>
            <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 px-4 mb-2">Direction</p>
            {NAV_ADMIN.map((item) => (
              <NavLink
                key={item.href}
                {...item}
                active={pathname === item.href.split("?")[0] && (
                  item.href === "/dashboard/admin" 
                    ? !pathname.includes("reception") 
                    : false
                ) || pathname === item.href.split("?")[0]}
              />
            ))}
            <div className="border-t border-zinc-100 my-3" />
          </>
        )}

        <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 px-4 mb-2">Réception</p>
        {NAV_RECEPTION.map((item) => (
          <NavLink
            key={item.href}
            {...item}
            active={pathname === item.href}
          />
        ))}
      </nav>

      {/* User footer */}
      <div className="border-t border-zinc-100 px-3 py-4">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-zinc-50">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-amber-700">
              {(user.name || user.email)[0].toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-zinc-800 truncate">{user.name || "Utilisateur"}</p>
            <p className="text-xs text-zinc-500 truncate">{user.role}</p>
          </div>
          <form action="/api/auth/signout" method="POST">
            <button type="submit" title="Se déconnecter" className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors">
              <LogOut size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-zinc-200 fixed inset-y-0 left-0 z-40">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-xl">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 md:ml-64 flex flex-col">
        {/* Mobile topbar */}
        <header className="md:hidden flex items-center h-14 px-4 border-b border-zinc-200 bg-white sticky top-0 z-30">
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg text-zinc-500 hover:bg-zinc-100">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2 ml-3">
            <div className="w-7 h-7 rounded-full overflow-hidden">
              <img src="/la_revelation_logo.jpg" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <span className="font-serif font-bold text-zinc-800">La Révélation</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 md:p-8 pb-24">
          {children}
        </main>
      </div>
    </div>
  )
}
