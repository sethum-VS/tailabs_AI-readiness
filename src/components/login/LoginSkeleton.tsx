'use client'

export function LoginSkeleton() {
  return (
    <div className="min-h-screen w-full flex bg-slate-50 text-slate-900 overflow-hidden">
      {/* Left Dark Hero Panel Skeleton */}
      <div className="hidden lg:flex w-[52%] flex-col justify-between bg-gradient-to-br from-[#090d16] via-[#0f172a] to-[#1e293b] p-12 lg:p-16 text-white relative overflow-hidden">
        {/* Background Mesh Effect */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(255,115,0,0.12)_0%,transparent_40%),radial-gradient(circle_at_15%_85%,rgba(59,130,246,0.10)_0%,transparent_45%)] pointer-events-none" />

        {/* Brand Header */}
        <div className="flex items-center gap-3 z-10">
          <div className="h-9 w-36 bg-slate-800/80 rounded-md animate-pulse" />
          <div className="h-5 w-20 bg-orange-500/20 border border-orange-500/30 rounded px-2 animate-pulse" />
        </div>

        {/* Hero Content */}
        <div className="max-w-xl my-auto space-y-6 z-10 w-full">
          <div className="h-6 w-44 bg-slate-800/60 rounded-full animate-pulse" />
          <div className="space-y-3">
            <div className="h-9 w-4/5 bg-slate-800/80 rounded-lg animate-pulse" />
            <div className="h-9 w-3/4 bg-slate-800/80 rounded-lg animate-pulse" />
          </div>
          <div className="space-y-2 pt-1">
            <div className="h-4 w-full bg-slate-800/50 rounded animate-pulse" />
            <div className="h-4 w-5/6 bg-slate-800/50 rounded animate-pulse" />
          </div>

          {/* Feature Item List Skeleton */}
          <div className="space-y-4 pt-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 p-3.5 rounded-xl bg-slate-800/30 border border-slate-800/50">
                <div className="h-10 w-10 rounded-lg bg-slate-800 animate-pulse shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-2/5 bg-slate-800/70 rounded animate-pulse" />
                  <div className="h-3 w-4/5 bg-slate-800/40 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="h-4 w-64 bg-slate-800/40 rounded animate-pulse z-10" />
      </div>

      {/* Right Login Form Panel Skeleton */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12 bg-white">
        <div className="w-full max-w-md space-y-8">
          {/* Form Header */}
          <div className="space-y-3 text-left">
            <div className="h-8 w-44 bg-slate-200 rounded-lg animate-pulse" />
            <div className="h-4 w-80 max-w-full bg-slate-100 rounded animate-pulse" />
          </div>

          {/* SSO Buttons */}
          <div className="space-y-3 pt-2">
            <div className="h-11 w-full bg-slate-100 border border-slate-200/80 rounded-xl animate-pulse" />
            <div className="h-11 w-full bg-slate-100 border border-slate-200/80 rounded-xl animate-pulse" />
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <div className="h-3 w-28 bg-slate-100 rounded animate-pulse shrink-0" />
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          {/* Credentials Form Inputs */}
          <div className="space-y-5">
            <div className="space-y-2">
              <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
              <div className="h-11 w-full bg-slate-100 border border-slate-200/80 rounded-lg animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
              <div className="h-11 w-full bg-slate-100 border border-slate-200/80 rounded-lg animate-pulse" />
            </div>
            <div className="pt-2">
              <div className="h-12 w-full bg-orange-500/80 rounded-xl animate-pulse" />
            </div>
          </div>

          {/* Form Footer */}
          <div className="pt-4 text-center space-y-2">
            <div className="h-3 w-48 bg-slate-100 rounded animate-pulse mx-auto" />
            <div className="h-3 w-64 bg-slate-100 rounded animate-pulse mx-auto" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginSkeleton
