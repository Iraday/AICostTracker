"use client";

import { useEffect, useState } from "react";
import "./globals.css";

type UsageData = {
  openai: { limit: number; used: number; refreshTime: string };
  claude: { limit: number; used: number; refreshTime: string };
  antigravity: { limit: number; used: number; refreshTime: string };
};

export default function Home() {
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/usage")
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch usage", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="loading">Initializing Sync...</div>;
  }

  if (!data) {
    return <div className="loading">Error Loading Data</div>;
  }

  return (
    <main className="dashboard-container">
      <header className="header">
        <h1>AI Usage Tracker</h1>
        <p>Real-time telemetry and limits for your local assistants</p>
      </header>

      <div className="cards-grid">
        {/* OpenAI / Codex Card */}
        <StatCard
          title="OpenAI API (Codex/GPT)"
          icon="🤖"
          used={data.openai.used}
          limit={data.openai.limit}
          refresh={data.openai.refreshTime}
          color="var(--accent-color)"
        />

        {/* Claude Desktop Card */}
        <StatCard
          title="Claude Desktop"
          icon="🧠"
          used={data.claude.used}
          limit={data.claude.limit}
          refresh={data.claude.refreshTime}
          color="var(--warning-color)"
        />

        {/* Google Antigravity Card */}
        <StatCard
          title="Google Antigravity"
          icon="🚀"
          used={data.antigravity.used}
          limit={data.antigravity.limit}
          refresh={data.antigravity.refreshTime}
          color="var(--success-color)"
        />
      </div>
    </main>
  );
}

function StatCard({ title, icon, used, limit, refresh, color }: { title: string, icon: string, used: number, limit: number, refresh: string, color: string }) {
  const percentage = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  
  // Dynamic color based on usage percentage
  const barColor = percentage > 90 ? "var(--danger-color)" : color;

  return (
    <div className="stat-card">
      <div className="card-header">
        <h2 className="card-title">{title}</h2>
        <div className="provider-icon">{icon}</div>
      </div>
      
      <div className="usage-stats">
        <span className="usage-used">{used}</span>
        <span className="usage-limit">/ {limit}</span>
      </div>

      <div className="progress-bar-container">
        <div 
          className="progress-bar" 
          style={{ width: `${percentage}%`, backgroundColor: barColor }} 
        />
      </div>

      <div className="refresh-info">
        <span>🔄 Refresh: {refresh}</span>
        <span style={{marginLeft: "auto"}}>{percentage}% Used</span>
      </div>
    </div>
  );
}
