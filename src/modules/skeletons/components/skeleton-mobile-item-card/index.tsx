/**
 * Skeleton for MobileItemCard — same stacked card structure, div-based.
 */
const SkeletonMobileItemCard = () => {
  return (
    <div className="flex gap-x-3 border-b border-hairline py-4">
      <div className="shrink-0 w-12 h-12 bg-gray-200 animate-pulse" />
      <div className="flex flex-1 min-w-0 flex-col gap-y-2">
        <div className="flex flex-col gap-y-1">
          <div className="w-32 h-4 bg-gray-200 animate-pulse" />
          <div className="w-24 h-4 bg-gray-200 animate-pulse" />
        </div>
        <div className="flex gap-2 items-center">
          <div className="w-6 h-8 bg-gray-200 animate-pulse" />
          <div className="w-14 h-10 bg-gray-200 animate-pulse" />
        </div>
      </div>
    </div>
  )
}

export default SkeletonMobileItemCard
