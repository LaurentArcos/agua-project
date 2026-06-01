import Dashboard from "@/components/Dashboard";
import { getAllReadings } from "@/lib/google-sheets";
import { computeStats } from "@/lib/aggregate";
import { config } from "@/lib/config";

// Toujours lire les données fraîches depuis le Sheet (pas de cache statique).
export const dynamic = "force-dynamic";

export default async function Home() {
  let readings;
  try {
    readings = await getAllReadings();
  } catch (err) {
    return <SetupError message={(err as Error).message} />;
  }

  const stats = computeStats(readings);

  return (
    <main className="min-h-screen bg-slate-100">
      <Dashboard
        readings={readings}
        stats={stats}
        thresholds={{
          green: config.thresholdGreen(),
          orange: config.thresholdOrange(),
          red: config.thresholdRed(),
        }}
      />
    </main>
  );
}

function SetupError({ message }: { message: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div className="max-w-md rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h1 className="mb-2 text-lg font-bold text-slate-900">
          ⚙️ Configuration requise
        </h1>
        <p className="mb-4 text-sm text-slate-600">
          Impossible de lire le Google Sheet. Vérifie ton fichier{" "}
          <code className="rounded bg-slate-100 px-1">.env</code> et le partage du
          document avec le compte de service.
        </p>
        <pre className="overflow-x-auto rounded-xl bg-slate-900 p-3 text-xs text-red-300">
          {message}
        </pre>
      </div>
    </main>
  );
}
