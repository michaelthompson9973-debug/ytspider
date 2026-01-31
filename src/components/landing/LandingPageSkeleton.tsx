import { Skeleton } from '@/components/ui/skeleton';

export function LandingPageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section Skeleton */}
      <div className="w-full h-64 md:h-96 bg-muted animate-pulse" />
      
      {/* Content Sections Skeleton */}
      <div className="container mx-auto py-8 px-4 space-y-6">
        {/* Title area */}
        <div className="space-y-3">
          <Skeleton className="h-8 w-3/4 max-w-md" />
          <Skeleton className="h-4 w-full max-w-2xl" />
          <Skeleton className="h-4 w-5/6 max-w-xl" />
        </div>

        {/* Feature cards skeleton */}
        <div className="grid md:grid-cols-3 gap-4 py-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 rounded-lg border bg-card space-y-3">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
            </div>
          ))}
        </div>

        {/* Image + text section */}
        <div className="grid md:grid-cols-2 gap-6 py-4">
          <Skeleton className="aspect-video rounded-lg" />
          <div className="space-y-3 flex flex-col justify-center">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </div>
      </div>

      {/* Checkout Section Skeleton */}
      <div className="bg-muted/50 py-12 px-4">
        <div className="container max-w-4xl mx-auto">
          {/* Section title */}
          <div className="text-center mb-8">
            <Skeleton className="h-7 w-48 mx-auto mb-2" />
            <Skeleton className="h-4 w-64 mx-auto" />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Product skeleton */}
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div 
                  key={i} 
                  className="flex items-center gap-3 p-3 bg-background rounded-lg border"
                >
                  <Skeleton className="w-14 h-14 rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-8 h-8 rounded" />
                    <Skeleton className="w-6 h-4" />
                    <Skeleton className="w-8 h-8 rounded" />
                  </div>
                </div>
              ))}
              
              {/* Price summary skeleton */}
              <div className="mt-4 p-4 bg-background rounded-lg border space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-14" />
                </div>
                <div className="border-t pt-2 flex justify-between">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </div>
            </div>

            {/* Form skeleton */}
            <div className="space-y-4 p-4 bg-background rounded-lg border">
              <Skeleton className="h-10 w-full rounded" />
              <Skeleton className="h-10 w-full rounded" />
              <Skeleton className="h-10 w-full rounded" />
              <Skeleton className="h-20 w-full rounded" />
              
              {/* Delivery options skeleton */}
              <div className="flex gap-3">
                <Skeleton className="h-10 w-1/2 rounded" />
                <Skeleton className="h-10 w-1/2 rounded" />
              </div>
              
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
