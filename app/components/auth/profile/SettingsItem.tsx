"use client";
import { useState } from "react";

export default function SettingsItem({ icon, title, toggle, onClick }: { icon: string; title: string; toggle?: boolean; onClick?: () => void }) {
  const [enabled, setEnabled] = useState(false);
  return (
    <div className="bg-ozio-card border border-ozio-card/50 rounded-2xl p-4 flex items-center justify-between hover:bg-ozio-card/50 transition" onClick={onClick} style={onClick ? { cursor: "pointer" } : undefined}>
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <span className="text-ozio-text font-medium">{title}</span>
      </div>
      {toggle ? (
        <button type="button" onClick={(e) => { e.stopPropagation(); setEnabled(!enabled); }} className={`w-12 h-6 rounded-full transition relative ${enabled ? "bg-ozio-blue" : "bg-ozio-card"}`}>
          <div className={`w-5 h-5 bg-white rounded-full transition-transform absolute top-0.5 ${enabled ? "translate-x-6" : "translate-x-0.5"}`} />
        </button>
      ) : (
        <svg className="w-5 h-5 text-ozio-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
      )}
    </div>
  );
}
