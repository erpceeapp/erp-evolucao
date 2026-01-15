import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="container mx-auto p-6">
      <Skeleton className="h-24 w-full mb-6" />
      <Skeleton className="h-96 w-full" />
    </div>
  )
}
