export function ProductDetailSkeleton() {
  return (
    <section className="container mx-auto py-12 px-4 sm:px-6 lg:px-8 animate-pulse">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 aspect-[3/4] max-h-[560px] rounded-lg bg-muted" />
        <div className="w-full lg:w-[380px] space-y-4">
          <div className="h-8 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-1/2" />
          <div className="h-6 bg-muted rounded w-1/3" />
          <div className="h-24 bg-muted rounded" />
        </div>
      </div>
    </section>
  );
}
