// Componente de Skeleton para cards em carregamento
export function ListingCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
      <div className="aspect-[4/3] bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded-full w-3/4" />
        <div className="h-3 bg-gray-100 rounded-full w-full" />
        <div className="h-3 bg-gray-100 rounded-full w-2/3" />
        <div className="flex items-center gap-2 py-2 border-t border-b border-gray-50">
          <div className="w-8 h-8 rounded-full bg-gray-200" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 bg-gray-200 rounded-full w-1/2" />
            <div className="h-2 bg-gray-100 rounded-full w-1/3" />
          </div>
        </div>
        <div className="flex justify-between items-center">
          <div className="h-3 bg-gray-100 rounded-full w-1/4" />
          <div className="h-8 bg-gray-200 rounded-lg w-1/4" />
        </div>
      </div>
    </div>
  )
}

// Grid de skeleton para feed
export function ListingFeedSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <ListingCardSkeleton key={i} />
      ))}
    </div>
  )
}

// Skeleton para card de perfil
export function ProfileCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
      <div className="h-24 bg-gray-200" />
      <div className="px-4 pb-4">
        <div className="-mt-10 mb-3">
          <div className="w-[72px] h-[72px] rounded-2xl bg-gray-300 border-4 border-white" />
        </div>
        <div className="space-y-2 mb-3">
          <div className="h-4 bg-gray-200 rounded-full w-2/3" />
          <div className="h-3 bg-gray-100 rounded-full w-1/2" />
          <div className="h-3 bg-gray-100 rounded-full w-1/3" />
        </div>
        <div className="flex gap-1.5 mb-3">
          <div className="h-6 bg-gray-100 rounded-full w-20" />
          <div className="h-6 bg-gray-100 rounded-full w-16" />
        </div>
        <div className="flex gap-2">
          <div className="h-8 bg-gray-200 rounded-xl flex-1" />
          <div className="h-8 bg-gray-200 rounded-xl w-10" />
        </div>
      </div>
    </div>
  )
}

// Skeleton para linha de conversa no chat
export function ConversationSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-1">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
          <div className="w-12 h-12 rounded-2xl bg-gray-200 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex justify-between">
              <div className="h-3 bg-gray-200 rounded-full w-1/3" />
              <div className="h-3 bg-gray-100 rounded-full w-12" />
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full w-2/3" />
          </div>
        </div>
      ))}
    </div>
  )
}
