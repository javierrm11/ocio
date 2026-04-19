import { ScheduleDay } from "./types";

export default function ScheduleEditor({ schedule, onChange }: { schedule: ScheduleDay[]; onChange: (s: ScheduleDay[]) => void }) {
  const update = (i: number, field: keyof ScheduleDay, value: any) => {
    const next = [...schedule];
    next[i] = { ...next[i], [field]: value };
    onChange(next);
  };
  return (
    <div className="space-y-1.5">
      {schedule.map((d, i) => (
        <div key={d.day} className="flex items-center gap-2 bg-ozio-dark rounded-xl px-3 py-2">
          <span className="w-20 text-ozio-text text-xs capitalize font-medium">{d.day}</span>
          <button
            type="button"
            aria-label={d.is_closed ? `Abrir ${d.day}` : `Cerrar ${d.day}`}
            onClick={() => update(i, 'is_closed', !d.is_closed)}
            className={`w-9 h-5 rounded-full relative transition flex-shrink-0 ${d.is_closed ? 'bg-ozio-card' : 'bg-ozio-blue'}`}
          >
            <div className={`w-4 h-4 bg-white rounded-full shadow absolute top-0.5 transition-transform ${d.is_closed ? 'translate-x-0.5' : 'translate-x-4'}`} />
          </button>
          {d.is_closed ? (
            <span className="text-ozio-text-muted text-xs flex-1">Cerrado</span>
          ) : (
            <div className="flex items-center gap-1.5 flex-1">
              <input type="time" value={d.open} onChange={e => update(i, 'open', e.target.value)}
                title={`Hora apertura ${d.day}`} aria-label={`Hora apertura ${d.day}`}
                className="bg-ozio-card/50 text-ozio-text text-xs rounded-lg px-2 py-1 border border-ozio-card focus:border-ozio-blue focus:outline-none w-24" />
              <span className="text-ozio-text-muted text-xs">–</span>
              <input type="time" value={d.close} onChange={e => update(i, 'close', e.target.value)}
                title={`Hora cierre ${d.day}`} aria-label={`Hora cierre ${d.day}`}
                className="bg-ozio-card/50 text-ozio-text text-xs rounded-lg px-2 py-1 border border-ozio-card focus:border-ozio-blue focus:outline-none w-24" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
