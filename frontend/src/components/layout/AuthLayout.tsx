import { Outlet, Link } from "react-router-dom";

export function AuthLayout() {
  return (
    <div className="dark min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black flex flex-col items-center justify-center p-4 text-gray-100">
      <div className="w-full max-w-md">
        <div className="rounded-xl bg-gray-900/95 ring-1 ring-white/10 shadow-xl overflow-hidden text-gray-100 [&_.text-muted-foreground]:text-gray-400 [&_.bg-card]:bg-gray-900 [&_a]:text-blue-300 [&_a:hover]:text-blue-200 [&_a:hover]:underline">
          <div className="px-4 pt-6 pb-2 flex justify-center">
            <Link
              to="/"
              className="text-2xl font-bold text-white flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <span>🎬</span>
              <span>Hhkungfu</span>
            </Link>
          </div>
          <div className="border-t border-border mx-4" aria-hidden />
          <Outlet />
        </div>
      </div>
    </div>
  );
}
