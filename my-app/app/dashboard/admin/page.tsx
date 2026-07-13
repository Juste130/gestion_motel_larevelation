import { getRooms, getDrinks } from "@/app/actions/catalog"
import { AdminClient } from "./client"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

const TAB_TITLES: Record<string, { title: string; sub: string }> = {
  resume:  { title: "Résumé & Statistiques", sub: "Vue d'ensemble de l'établissement" },
  caisse:  { title: "Caisse & Dépenses",      sub: "Suivez les mouvements de trésorerie" },
  stock:   { title: "Stock des Boissons",     sub: "Consultez et mettez à jour les niveaux de stock" },
  params:  { title: "Paramètres",             sub: "Gérez le catalogue de chambres et de boissons" },
  users:   { title: "Gestion de l'Équipe",    sub: "Créez et gérez les comptes du personnel" },
}

export default async function AdminPage(
  props: {
    searchParams: Promise<{ tab?: string }>
  }
) {
  const searchParams = await props.searchParams
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role

  if (role !== "DG" && role !== "ADMIN") {
    redirect("/dashboard/reception")
  }

  const tab = searchParams?.tab || "resume"
  const meta = TAB_TITLES[tab] || TAB_TITLES.resume

  const [rooms, drinks] = await Promise.all([getRooms(), getDrinks()])

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-7">
        <h1 className="font-serif text-3xl font-bold text-zinc-800">{meta.title}</h1>
        <p className="text-zinc-500 text-base mt-1">{meta.sub}</p>
      </div>
      <AdminClient rooms={rooms} drinks={drinks} tab={tab} />
    </div>
  )
}
