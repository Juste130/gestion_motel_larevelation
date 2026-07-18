"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard, Wallet, Package, Settings,
  Users, BarChart2, LogOut, Menu, ChevronRight, ChevronLeft, BookOpen
} from "lucide-react"
import { signOut } from "next-auth/react"

interface SidebarLayoutProps {
  user: { name: string; email: string; role: string }
  lowStockCount?: number
  children: React.ReactNode
}

type NavItem = {
  href: string
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  roles: string[]
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard",         label: "Tableau de bord",    icon: LayoutDashboard, roles: ["ADMIN", "DG", "RECEPTIONIST"] },
  { href: "/dashboard/registre",label: "Registre & Séjours", icon: BookOpen,        roles: ["ADMIN", "DG", "RECEPTIONIST"] },
  { href: "/dashboard/finances",label: "Recettes & Dépenses",icon: Wallet,           roles: ["ADMIN", "DG", "RECEPTIONIST"] },
  { href: "/dashboard/stock",   label: "Stock",              icon: Package,          roles: ["ADMIN", "DG", "RECEPTIONIST"] },
  { href: "/dashboard/params",  label: "Paramètres",         icon: Settings,         roles: ["ADMIN", "DG", "RECEPTIONIST"] },
  { href: "/dashboard/users",   label: "Équipe",             icon: Users,            roles: ["ADMIN", "DG"] },
  { href: "/dashboard/bilans",  label: "Bilans & Clôtures",  icon: BarChart2,        roles: ["ADMIN", "DG", "RECEPTIONIST"] },
]

function NavLink({ href, label, icon: Icon, active, collapsed, badge }: {
  href: string; label: string; icon: NavItem["icon"]; active: boolean; collapsed: boolean; badge?: number
}) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={`relative flex items-center gap-3 py-2.5 rounded-md text-[15px] font-medium transition-all duration-150 ${
        collapsed ? "justify-center px-0 mx-2" : "px-4"
      } ${
        active
          ? "bg-amber-50 text-amber-700 font-semibold"
          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
      }`}
    >
      <div className="relative">
        <Icon size={18} className={`flex-shrink-0 ${active ? "text-amber-600" : "text-zinc-400"}`} />
        {collapsed && badge !== undefined && badge > 0 && (
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
        )}
      </div>
      {!collapsed && (
        <>
          <span className="truncate">{label}</span>
          {badge !== undefined && badge > 0 && (
            <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md leading-none flex-shrink-0">
              {badge}
            </span>
          )}
          {active && (!badge || badge === 0) && <ChevronRight size={14} className="ml-auto text-amber-400 flex-shrink-0" />}
        </>
      )}
    </Link>
  )
}

export function SidebarLayout({ user, lowStockCount = 0, children }: SidebarLayoutProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  const visibleItems = NAV_ITEMS.filter(item => item.roles.includes(user.role))

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard"
    return pathname.startsWith(href)
  }

  const roleLabel = user.role === "ADMIN" ? "Administrateur" : user.role === "DG" ? "Directeur Général" : "Réceptionniste"

  const renderSidebar = (isMobile = false) => {
    const collapsed = isMobile ? false : isCollapsed

    return (
      <div className="flex flex-col h-full relative">
        {/* Collapse toggle */}
        {!isMobile && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3 top-7 w-6 h-6 bg-white border border-zinc-200 rounded-full flex items-center justify-center text-zinc-400 hover:text-amber-600 hover:border-amber-200 z-50 shadow-sm transition-colors"
          >
            {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
          </button>
        )}

        {/* Logo */}
        <div className={`flex items-center gap-3 py-5 border-b border-zinc-100 transition-all duration-300 ${collapsed ? "px-0 justify-center" : "px-5"}`}>
          <div className={`rounded-full overflow-hidden border-2 border-amber-100 flex-shrink-0 shadow-sm` + ` ${collapsed ? "w-8 h-8 md:w-10 md:h-10" : "w-12 h-12 md:w-16 md:h-16"}`}>
            <img src="/la_revelation_logo.jpg" alt="Logo" className="w-full h-full object-cover" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-[14px] font-bold text-amber-600 uppercase tracking-widest leading-none">Motel</p>
              <p className="font-serif text-[20px] font-bold text-zinc-900 leading-snug truncate">La Révélation</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 flex flex-col gap-0.5 overflow-y-auto overflow-x-hidden">
          {visibleItems.map(item => (
            <NavLink
              key={item.href}
              {...item}
              active={isActive(item.href)}
              collapsed={collapsed}
              badge={item.label === "Stock" ? lowStockCount : undefined}
            />
          ))}
        </nav>

        {/* User footer */}
        <div className="border-t border-zinc-100 py-3">
          <div className={`flex items-center gap-3 py-2 rounded-md bg-zinc-50 transition-all ${collapsed ? "px-0 mx-2 justify-center" : "px-3 mx-3"}`}>
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-amber-700">
                {(user.name || user.email)[0].toUpperCase()}
              </span>
            </div>
            {!collapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-800 truncate">{user.name || "Utilisateur"}</p>
                  <p className="text-[11px] text-zinc-400 truncate">{roleLabel}</p>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  title="Se déconnecter"
                  className="p-1.5 rounded-sm text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={16} />
                </button>
              </>
            )}
          </div>
          {collapsed && (
            <div className="flex justify-center mt-1">
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                title="Se déconnecter"
                className="p-1.5 rounded-sm text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      {/* Desktop sidebar */}
      <aside className={`hidden md:flex flex-col bg-white border-r border-zinc-200 fixed inset-y-0 left-0 z-40 transition-all duration-300 ease-in-out ${isCollapsed ? "w-[72px]" : "w-64"}`}>
        {renderSidebar()}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-2xl">
            {renderSidebar(true)}
          </aside>
        </div>
      )}

      {/* Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${isCollapsed ? "md:ml-[72px]" : "md:ml-64"}`}>
        {/* Mobile topbar */}
        <header className="md:hidden flex items-center h-14 px-4 border-b border-zinc-200 bg-white sticky top-0 z-30 gap-3">
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-sm text-zinc-500 hover:bg-zinc-100">
            <Menu size={20} />
          </button>
          <div className="w-7 h-7 rounded-full overflow-hidden border border-amber-100">
            <img src="/la_revelation_logo.jpg" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <span className="font-serif font-bold text-zinc-800 text-sm">La Révélation</span>
        </header>

        {/* Page content */}
        <main className="flex-1 p-5 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
