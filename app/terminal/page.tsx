import { currentUser } from "@clerk/nextjs/server";
import NewsBar from "@/components/terminal/NewsBar";
import ScreenerPanel from "@/components/terminal/ScreenerPanel";
import TopPicksPanel from "@/components/terminal/TopPicksPanel";
import ChatPanel from "@/components/terminal/ChatPanel";
import TerminalHeader from "@/components/terminal/TerminalHeader";
import PortfolioPanel from "@/components/terminal/PortfolioPanel";
import PerformancePanel from "@/components/terminal/PerformancePanel";
import PortfolioIntelligencePanel from "@/components/terminal/PortfolioIntelligencePanel";
import WatchlistsPanel from "@/components/terminal/WatchlistsPanel";
import BrokerageLinkPanel from "@/components/terminal/BrokerageLinkPanel";
import BrokerageAccountsPanel from "@/components/terminal/BrokerageAccountsPanel";
import BrokeragePositionsPanel from "@/components/terminal/BrokeragePositionsPanel";
import {
  getRecentSignalHistory,
  getSignalPerformanceStats,
} from "@/lib/signalPerformance";

export default async function TerminalPage() {
  const user = await currentUser();
  const stats = await getSignalPerformanceStats();
  const history = await getRecentSignalHistory(12);

  return (
    <main className="min-h-screen bg-black px-6 py-6 text-white">
      <div className="mx-auto max-w-7xl">
        <TerminalHeader
          email={user?.emailAddresses[0]?.emailAddress ?? "No email found"}
        />

        <div className="mb-6">
          <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">
            Dashboard
          </p>
          <h2 className="mt-2 text-3xl font-bold text-white md:text-4xl">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ""}
          </h2>
          <p className="mt-2 text-zinc-400">
            Your investing workspace is ready.
          </p>
        </div>

        <div className="space-y-6">
          <NewsBar />

          <TopPicksPanel />

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="min-h-[700px]">
              <ChatPanel />
            </div>

            <div className="min-h-[700px]">
              <ScreenerPanel />
            </div>
          </div>

          <BrokerageLinkPanel />

          <BrokerageAccountsPanel />

          <BrokeragePositionsPanel />

          <PortfolioPanel />

          <PortfolioIntelligencePanel />

          <WatchlistsPanel />

          <PerformancePanel stats={stats} history={history} />
        </div>
      </div>
    </main>
  );
}