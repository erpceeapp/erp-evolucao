"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, BookOpen, GraduationCap, School, Clipboard, Folder, LinkIcon, ExternalLink } from 'lucide-react'

type LinkDocumento = {
  id: string
  titulo: string
  url: string
  descricao: string | null
  icone: string
  cor: string
  ordem: number
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  "file-text": FileText,
  "book-open": BookOpen,
  "graduation-cap": GraduationCap,
  school: School,
  clipboard: Clipboard,
  folder: Folder,
  link: LinkIcon,
  "external-link": ExternalLink,
}

const colorMap: Record<string, string> = {
  blue: "bg-blue-500 hover:bg-blue-600",
  green: "bg-green-500 hover:bg-green-600",
  purple: "bg-purple-500 hover:bg-purple-600",
  orange: "bg-orange-500 hover:bg-orange-600",
  red: "bg-red-500 hover:bg-red-600",
  cyan: "bg-cyan-500 hover:bg-cyan-600",
  pink: "bg-pink-500 hover:bg-pink-600",
}

export function LinksDocumentosCard() {
  const [links, setLinks] = useState<LinkDocumento[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadLinks() {
      try {
        const { data, error } = await supabase
          .from("links_documentos")
          .select("id, titulo, url, descricao, icone, cor, ordem")
          .eq("ativo", true)
          .order("ordem", { ascending: true })

        if (error) throw error
        setLinks(data || [])
      } finally {
        setLoading(false)
      }
    }

    loadLinks()
  }, [])

  if (loading) {
    return null
  }

  if (links.length === 0) {
    return null
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Documentos e Links</h3>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <LinkIcon className="h-5 w-5" />
            <span>Links Importantes</span>
          </CardTitle>
          <CardDescription>Acesse documentos e recursos importantes rapidamente</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {links.map((link) => {
              const Icon = iconMap[link.icone] || FileText
              const colorClass = colorMap[link.cor] || colorMap.blue

              return (
                <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer">
                  <Button className={`${colorClass} w-full h-auto p-4 flex flex-col items-start text-white`}>
                    <div className="flex items-center space-x-2 mb-1">
                      <Icon className="h-5 w-5" />
                      <span className="font-medium text-left">{link.titulo}</span>
                    </div>
                    {link.descricao && <span className="text-xs opacity-90 text-left">{link.descricao}</span>}
                  </Button>
                </a>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
