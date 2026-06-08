"use client";

import { useEffect, useState } from "react";
import "./globals.css";

type LimitData = {
  label: string;
  usedPercentage: number;
  resetText: string;
};

type UsageData = {
  openai: { limits: LimitData[] };
  claude: { limits: LimitData[] };
  antigravity: { limits: LimitData[] };
};

export default function Home() {
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/usage");
      const d = await res.json();
      setData(d);
    } catch (err) {
      console.error("Failed to fetch usage", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
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
        <button 
          className={`refresh-btn ${isRefreshing ? 'refreshing' : ''}`} 
          onClick={loadData}
          disabled={isRefreshing}
        >
          {isRefreshing ? '🔄 Refreshing...' : '🔄 Refresh Data'}
        </button>
      </header>

      <div className="cards-grid">
        {/* Claude Desktop Card */}
        <StatCard
          title="Claude Desktop (Pro)"
          icon="🧠"
          limits={data.claude.limits}
          color="var(--warning-color)"
        />

        {/* Codex/Cursor Card */}
        <StatCard
          title="Codex / Cursor"
          icon="🤖"
          limits={data.openai.limits}
          color="var(--accent-color)"
        />

        {/* Google Antigravity Card */}
        <StatCard
          title="Google Antigravity"
          icon="🚀"
          limits={data.antigravity.limits}
          color="var(--success-color)"
        />
      </div>
    </main>
  );
}

function StatCard({ title, icon, limits, color }: { title: string, icon: string, limits: LimitData[], color: string }) {
  return (
    <div className="stat-card">
      <div className="card-header">
        <h2 className="card-title">{title}</h2>
        <div className="provider-icon">{icon}</div>
      </div>
      
      <div className="limits-container">
        {limits.map((limit, idx) => {
          const barColor = limit.usedPercentage > 90 ? "var(--danger-color)" : color;
          
          return (
            <div key={idx} className="limit-row">
              <div className="limit-header">
                <span className="limit-label">{limit.label}</span>
                <span className="limit-percentage">{limit.usedPercentage}% used</span>
              </div>
              
              <div className="progress-bar-container">
                <div 
                  className="progress-bar" 
                  style={{ width: `${Math.min(100, Math.max(0, limit.usedPercentage))}%`, backgroundColor: barColor }} 
                />
              </div>
              
              <div className="limit-footer">
                <span className="limit-reset">{limit.resetText}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
