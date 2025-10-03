"use client"

import type React from "react"
import { AppSidebar } from "./app-sidebar"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed")
    if (saved !== null) {
      setIsCollapsed(saved === "true")
    }

    const handleStorageChange = () => {
      const saved = localStorage.getItem("sidebar-collapsed")
      if (saved !== null) {
        setIsCollapsed(saved === "true")
      }
    }

    window.addEventListener("storage", handleStorageChange)
    const interval = setInterval(handleStorageChange, 100)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      clearInterval(interval)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <AppSidebar />
      <main className={cn("transition-all duration-300 min-h-screen", isCollapsed ? "ml-16" : "ml-64")}>
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
