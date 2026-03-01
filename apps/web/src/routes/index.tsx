import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 text-white">
      <div className="text-center">
        <h1 className="text-6xl font-bold tracking-tight">
          <span className="text-emerald-400">Regista</span>
        </h1>
        <p className="mt-4 text-xl text-zinc-400">
          Football Management Game
        </p>
        <div className="mt-8 flex items-center gap-2 text-sm text-zinc-500">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          Project setup complete — ready for development
        </div>
      </div>
    </div>
  );
}
