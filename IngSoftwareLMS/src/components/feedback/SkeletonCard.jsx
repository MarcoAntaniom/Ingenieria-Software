export function SkeletonCard() {
  return (
    <div
      aria-hidden="true"
      className="flex flex-col justify-between rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs animate-pulse"
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="h-5 w-24 rounded-md bg-[#F1F5F9]" />
          <div className="h-5 w-20 rounded-md bg-[#F1F5F9]" />
        </div>
        <div className="h-6 w-4/5 rounded-md bg-[#E2E8F0] mb-2" />
        <div className="h-4 w-1/2 rounded-md bg-[#F1F5F9] mb-4" />

        <div className="space-y-1.5 mb-4">
          <div className="flex justify-between">
            <div className="h-3 w-28 rounded bg-[#F1F5F9]" />
            <div className="h-3 w-10 rounded bg-[#F1F5F9]" />
          </div>
          <div className="h-2 w-full rounded-full bg-[#F1F5F9]" />
        </div>

        <div className="h-16 w-full rounded-xl bg-[#F8FAFC] border border-[#F1F5F9] p-3 mb-4" />
      </div>

      <div className="pt-3 border-t border-[#F1F5F9]">
        <div className="h-10 w-full rounded-xl bg-[#F1F5F9]" />
      </div>
    </div>
  )
}
