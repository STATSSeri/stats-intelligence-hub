export default function LoadingSkeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rounded-lg border border-border bg-bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-3 w-16 bg-border rounded" />
            <div className="h-3 w-12 bg-border rounded" />
          </div>
          <div className="h-4 w-3/4 bg-border rounded mb-2" />
          <div className="h-3 w-full bg-border/50 rounded" />
        </div>
      ))}
    </div>
  )
}
