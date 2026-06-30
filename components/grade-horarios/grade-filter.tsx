"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Check, ChevronsUpDown } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

interface Option {
  value: string
  label: string
}

interface GradeFilterProps {
  filtroTipo: "turma" | "professor"
  filtroId: string | null
  onChange: (tipo: "turma" | "professor", id: string | null, label?: string) => void
  onLabelChange?: (label: string) => void
}

export function GradeFilter({ filtroTipo, filtroId, onChange }: GradeFilterProps) {
  const [options, setOptions] = useState<Option[]>([])
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    setLoading(true)
    setOpen(false)
    setSearch("")
    setOptions([])
    onChange(filtroTipo, null)

    const fetchOptions = async () => {
      if (filtroTipo === "turma") {
        const { data } = await supabase
          .from("turmas")
          .select("id, nome, serie, ano_letivo")
          .eq("ativo", true)
          .order("nome")
        setOptions(
          (data || []).map((t: any) => ({
            value: t.id,
            label: `${t.nome} (${t.ano_letivo})`,
          })),
        )
      } else {
        const { data } = await supabase
          .from("professores")
          .select("id, nome_completo")
          .eq("ativo", true)
          .order("nome_completo")
        setOptions(
          (data || []).map((p: any) => ({
            value: p.id,
            label: p.nome_completo,
          })),
        )
      }
      setLoading(false)
    }
    fetchOptions()
  }, [filtroTipo])

  const filtered = search
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options

  const selectedLabel = filtroId ? options.find((o) => o.value === filtroId)?.label : null

  return (
    <div className="flex items-center gap-4">
      <div className="flex rounded-md border overflow-hidden">
        <button
          type="button"
          className={cn(
            "px-3 py-1.5 text-sm transition-colors rounded-none",
            filtroTipo === "turma"
              ? "bg-primary text-primary-foreground"
              : "bg-background text-muted-foreground hover:bg-muted",
          )}
          onClick={() => onChange("turma", null)}
        >
          Por Turma
        </button>
        <button
          type="button"
          className={cn(
            "px-3 py-1.5 text-sm transition-colors rounded-none border-l",
            filtroTipo === "professor"
              ? "bg-primary text-primary-foreground"
              : "bg-background text-muted-foreground hover:bg-muted",
          )}
          onClick={() => onChange("professor", null)}
        >
          Por Professor
        </button>
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-72 justify-between"
            disabled={loading}
          >
            {loading
              ? "Carregando..."
              : selectedLabel || `Selecione ${filtroTipo === "turma" ? "uma turma" : "um professor"}...`}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0">
          <Command>
            <CommandInput
              placeholder={`Buscar ${filtroTipo === "turma" ? "turma" : "professor"}...`}
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>Nenhum resultado</CommandEmpty>
              <CommandGroup>
                {filtered.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => {
                      onChange(filtroTipo, option.value, option.label)
                      setOpen(false)
                      setSearch("")
                    }}
                  >
                    <Check className={cn("mr-2 h-4 w-4", filtroId === option.value ? "opacity-100" : "opacity-0")} />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
