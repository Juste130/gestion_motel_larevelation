import { ReactNode } from "react"

interface PageHeaderProps {
  title: string
  description?: string
  action?: ReactNode
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 className="font-serif text-3xl font-bold text-zinc-900">{title}</h1>
        {description && (
          <p className="text-zinc-500 mt-1 text-sm">{description}</p>
        )}
      </div>
      {action && (
        <div className="flex items-center gap-3 flex-shrink-0">
          {action}
        </div>
      )}
    </div>
  )
}
