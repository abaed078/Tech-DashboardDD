import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { DashboardPage } from "@/pages/DashboardPage";
import { NetworkPage } from "@/pages/NetworkPage";
import { SecurityPage } from "@/pages/SecurityPage";
import { SystemsPage } from "@/pages/SystemsPage";
import { TerminalPage } from "@/pages/TerminalPage";
import { AlertsPage } from "@/pages/AlertsPage";

export type PageId = "dashboard" | "network" | "security" | "systems" | "terminal" | "alerts";

function App() {
  const [activePage, setActivePage] = useState<PageId>("dashboard");

  const renderPage = () => {
    switch (activePage) {
      case "dashboard": return <DashboardPage />;
      case "network": return <NetworkPage />;
      case "security": return <SecurityPage />;
      case "systems": return <SystemsPage />;
      case "terminal": return <TerminalPage />;
      case "alerts": return <AlertsPage />;
      default: return <DashboardPage />;
    }
  };

  return (
    <div className="device-frame" style={{
      display: 'grid',
      gridTemplateColumns: '240px 1fr',
      height: '100vh',
      background: '#000',
    }}>
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <main style={{
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: '#0a0a0a',
      }}>
        {renderPage()}
      </main>
    </div>
  );
}

export default App;
