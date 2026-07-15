"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Check, ChevronsUpDown } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { cn } from "@/lib/utils"

interface SearchableSelectProps {
  value: string
  onChange: (value: string) => void
  placeholder: string
  allLabel?: string
  options: { value: string; label: string }[]
}

export function SearchableSelect({ value, onChange, placeholder, allLabel, options }: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const filtered = search
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options

  const selectedLabel = value && value !== "todos"
    ? options.find((o) => o.value === value)?.label
    : undefined

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full sm:w-48 justify-between overflow-hidden"
        >
          <span className="truncate">{selectedLabel || allLabel || placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          <CommandInput placeholder={`Buscar ${placeholder}...`} value={search} onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty>Nenhum resultado</CommandEmpty>
            <CommandGroup>
              {allLabel && (
                <CommandItem
                  value="todos"
                  onSelect={() => {
                    onChange("todos")
                    setOpen(false)
                    setSearch("")
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4 shrink-0", value === "todos" || !value ? "opacity-100" : "opacity-0")} />
                  <span className="truncate">{allLabel}</span>
                </CommandItem>
              )}
              {filtered.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => {
                    onChange(option.value)
                    setOpen(false)
                    setSearch("")
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4 shrink-0", value === option.value ? "opacity-100" : "opacity-0")} />
                  <span className="truncate">{option.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
