"use client"

import { ReactNode } from "react"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Tipo de hospital que usan los dashboards
export type Hospital = {
  id: string
  name: string
}

type AnyUser = {
  full_name?: string | null
  [key: string]: any
}

type NavItem = {
  id: string
  label: string
  icon?: ReactNode
}

interface RoleShellProps {
  user: AnyUser
  roleLabel: string

  navItems: NavItem[]
  activeSection: string
  onSectionChange: (id: any) => void

  hospitals: Hospital[]
  selectedHospitalId: string | null
  onHospitalChange: (id: string) => void

  onSignOut: () => void

  children: ReactNode
}

export function RoleShell({
  user,
  roleLabel,
  navItems,
  activeSection,
  onSectionChange,
  hospitals,
  selectedHospitalId,
  onHospitalChange,
  onSignOut,
  children,
}: RoleShellProps) {
  const selectedHospital =
    hospitals.find((h) => h.id === selectedHospitalId) ?? null

  const activeItem = navItems.find((n) => n.id === activeSection) ?? navItems[0]

  return (
    <div className="min-h-screen bg-slate-900/5">
      <div className="flex min-h-screen">
        {/* SIDEBAR */}
        <aside className="hidden w-64 flex-col border-r border-slate-800 bg-slate-950 text-slate-100 md:flex">
          {/* Logo / título */}
          <div className="flex items-center gap-2 border-b border-slate-800 px-5 py-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/90 text-sm font-bold text-white">
              SA
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Sistema Anestesia
              </span>
              <span className="text-sm font-semibold">
                Panel {roleLabel}
              </span>
            </div>
          </div>

          {/* Usuario actual */}
          <div className="border-b border-slate-800 px-5 py-4 text-xs">
            <p className="text-slate-400">Usuario actual</p>
            <p className="font-semibold text-slate-50">
              {user.full_name ?? "Usuario"}
            </p>
            {selectedHospital && (
              <p className="mt-1 text-[11px] text-slate-400">
                Hospital:{" "}
                <span className="font-medium">{selectedHospital.name}</span>
              </p>
            )}
          </div>

          {/* Navegación */}
          <nav className="flex-1 px-3 py-4 text-sm">
            <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Navegación
            </p>
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onSectionChange(item.id)}
                    className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs ${
                      activeSection === item.id
                        ? "bg-slate-900 text-slate-100"
                        : "text-slate-300 hover:bg-slate-900/70"
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Logout */}
          <div className="border-t border-slate-800 px-5 py-4">
            <Button
              variant="outline"
              size="sm"
              className="w-full border-slate-700 bg-slate-900 text-xs text-slate-100 hover:bg-slate-800"
              onClick={onSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar sesión
            </Button>
          </div>
        </aside>

        {/* CONTENIDO PRINCIPAL */}
        <div className="flex flex-1 flex-col">
          {/* Header superior */}
          <header className="border-b bg-white/80 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {activeItem.label} · {roleLabel}
                </span>
                <h1 className="text-xl font-semibold text-slate-900">
                  Bienvenido,{" "}
                  <span className="font-bold">
                    {user.full_name ?? "Usuario"}
                  </span>
                </h1>
                {selectedHospital && (
                  <p className="text-xs text-slate-500">
                    Actualmente trabajando en{" "}
                    <span className="font-semibold">
                      {selectedHospital.name}
                    </span>
                  </p>
                )}
              </div>

              {/* Selector de hospital + logout (para móvil) */}
              <div className="flex flex-col items-end gap-2 md:hidden">
                {hospitals.length > 0 && (
                  <Select
                    value={selectedHospitalId ?? undefined}
                    onValueChange={(value) => onHospitalChange(value)}
                  >
                    <SelectTrigger className="w-52 rounded-lg border-slate-300 bg-slate-50 text-xs">
                      <SelectValue placeholder="Selecciona un hospital" />
                    </SelectTrigger>
                    <SelectContent>
                      {hospitals.map((h) => (
                        <SelectItem key={h.id} value={h.id}>
                          {h.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-300 text-xs text-slate-700"
                  onClick={onSignOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar sesión
                </Button>
              </div>
            </div>
          </header>

          {/* Contenido */}
          <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6">
            {/* Selector de hospital (versión escritorio) */}
            {hospitals.length > 0 && (
              <section className="hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:block">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      Hospital seleccionado
                    </p>
                    {selectedHospital ? (
                      <p className="text-xs text-slate-500">
                        Actualmente trabajando en:{" "}
                        <span className="font-semibold">
                          {selectedHospital.name}
                        </span>
                      </p>
                    ) : (
                      <p className="text-xs text-red-600">
                        No tienes un hospital seleccionado.
                      </p>
                    )}
                  </div>

                  <Select
                    value={selectedHospitalId ?? undefined}
                    onValueChange={(value) => onHospitalChange(value)}
                  >
                    <SelectTrigger className="w-full rounded-lg border-slate-300 bg-slate-50 text-sm md:w-80">
                      <SelectValue placeholder="Selecciona un hospital" />
                    </SelectTrigger>
                    <SelectContent>
                      {hospitals.map((h) => (
                        <SelectItem key={h.id} value={h.id}>
                          {h.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </section>
            )}

            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
