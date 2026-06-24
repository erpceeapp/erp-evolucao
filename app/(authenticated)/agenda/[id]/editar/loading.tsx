export default function Loading() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="animate-pulse space-y-6">
        <div className="h-10 w-32 bg-muted rounded" />
        <div className="h-64 bg-muted rounded-lg" />
      </div>
    </div>
  )
}
