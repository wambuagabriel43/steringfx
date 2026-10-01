import React, { useMemo, useState, useEffect } from 'react';
import { EconomicEvent } from '../types.ts';
import { Calendar, Clock, Globe, AlertTriangle, CheckCircle2, ChevronRight, Info } from 'lucide-react';

interface EconomicCalendarProps {
  events: EconomicEvent[];
}

export function parseGmtAndLocalTime(timeStr: string) {
  // Extract hours and minutes from e.g. "13:30 GMT" or "13:30"
  const match = timeStr.match(/(\d{1,2}):(\d{2})/);
  if (!match) {
    return {
      gmtTime: timeStr,
      localTime: timeStr,
      tzAbbr: 'Local',
      hours: 12,
      minutes: 0,
      diffMinutes: 0,
    };
  }

  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);

  const now = new Date();
  const utcDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hours, minutes, 0));

  // User device local time
  const localTime = utcDate.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  // Local Timezone short abbreviation
  const tzAbbr = new Intl.DateTimeFormat([], { timeZoneName: 'short' })
    .formatToParts(now)
    .find((p) => p.type === 'timeZoneName')?.value || 'Local';

  const gmtTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} GMT`;

  // Calculate minutes difference from now (UTC)
  const nowUtcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const eventUtcMinutes = hours * 60 + minutes;
  const diffMinutes = eventUtcMinutes - nowUtcMinutes;

  return {
    gmtTime,
    localTime,
    tzAbbr,
    hours,
    minutes,
    diffMinutes,
  };
}

export const EconomicCalendar: React.FC<EconomicCalendarProps> = ({ events }) => {
  const [filterImpact, setFilterImpact] = useState<'ALL' | 'HIGH'>('ALL');
  const [currentTime, setCurrentTime] = useState({
    local: '',
    gmt: '',
    tz: '',
  });

  // Live clocks for header
  useEffect(() => {
    const updateClocks = () => {
      const now = new Date();
      const localStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
      const gmtHours = String(now.getUTCHours()).padStart(2, '0');
      const gmtMins = String(now.getUTCMinutes()).padStart(2, '0');
      const gmtSecs = String(now.getUTCSeconds()).padStart(2, '0');
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const tzShort = new Intl.DateTimeFormat([], { timeZoneName: 'short' }).formatToParts(now).find(p => p.type === 'timeZoneName')?.value || tz;

      setCurrentTime({
        local: `${localStr} (${tzShort})`,
        gmt: `${gmtHours}:${gmtMins}:${gmtSecs} GMT`,
        tz: tzShort,
      });
    };

    updateClocks();
    const interval = setInterval(updateClocks, 1000);
    return () => clearInterval(interval);
  }, []);

  const filteredEvents = useMemo(() => {
    if (filterImpact === 'HIGH') {
      return events.filter((e) => e.impact === 'HIGH');
    }
    return events;
  }, [events, filterImpact]);

  return (
    <div className="bg-[#0e1424] border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="px-4 py-3 bg-[#12192d] border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-white font-mono uppercase tracking-wider flex items-center gap-2">
              Economic Calendar
              <span className="text-[10px] font-normal normal-case px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                Local & GMT Sync
              </span>
            </h3>
            <p className="text-[10px] text-slate-400">High & Medium Market Volatility Drivers</p>
          </div>
        </div>

        {/* Live dual clock pill */}
        <div className="flex items-center gap-2 font-mono text-[10px]">
          <div className="flex items-center gap-1 px-2 py-1 rounded bg-[#090d18] border border-emerald-500/30 text-emerald-400">
            <Clock className="w-3 h-3 animate-pulse" />
            <span>Local: {currentTime.local || 'Detecting...'}</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded bg-[#090d18] border border-slate-700 text-slate-300">
            <Globe className="w-3 h-3 text-sky-400" />
            <span>{currentTime.gmt || 'GMT'}</span>
          </div>
        </div>
      </div>

      {/* Filter / Subhead Strip */}
      <div className="px-4 py-2 bg-[#0a0f1d] border-b border-slate-800/80 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-[10px] uppercase font-mono tracking-wider">Filter:</span>
          <button
            onClick={() => setFilterImpact('ALL')}
            className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-medium transition-all ${
              filterImpact === 'ALL'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Events ({events.length})
          </button>
          <button
            onClick={() => setFilterImpact('HIGH')}
            className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-medium transition-all flex items-center gap-1 ${
              filterImpact === 'HIGH'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'text-slate-400 hover:text-rose-300'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            High Impact Only ({events.filter(e => e.impact === 'HIGH').length})
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-1 text-[10px] text-slate-400 font-mono">
          <span className="text-emerald-400 font-semibold">Local Time</span>
          <span>&</span>
          <span className="text-slate-300">GMT Standard</span>
        </div>
      </div>

      {/* Events List */}
      <div className="divide-y divide-slate-800/60 text-xs">
        {filteredEvents.map((ev) => {
          const { gmtTime, localTime, tzAbbr, diffMinutes } = parseGmtAndLocalTime(ev.time);
          const isHigh = ev.impact === 'HIGH';
          const isUpcoming = ev.status === 'UPCOMING';

          let timeCountdown = '';
          if (isUpcoming) {
            if (diffMinutes > 0) {
              const h = Math.floor(diffMinutes / 60);
              const m = diffMinutes % 60;
              timeCountdown = h > 0 ? `In ${h}h ${m}m` : `In ${m}m`;
            } else if (diffMinutes > -30) {
              timeCountdown = 'Releasing now';
            }
          }

          return (
            <div key={ev.id} className="p-3.5 hover:bg-[#131a2e]/60 transition-all flex flex-col gap-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                {/* Currency and Impact tags */}
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#1a233a] text-cyan-300 border border-cyan-500/30 shadow-sm">
                    {ev.currency}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wide uppercase ${
                      isHigh
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {isHigh ? 'High Impact' : 'Medium Impact'}
                  </span>

                  {timeCountdown && (
                    <span className="text-[10px] font-mono font-medium text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                      {timeCountdown}
                    </span>
                  )}
                </div>

                {/* Dual Timing Pill: Local Device Time + GMT Time */}
                <div className="flex items-center gap-1.5 font-mono text-[11px]">
                  {/* Local Device Time */}
                  <div
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold shadow-sm"
                    title={`Your local device time (${currentTime.tz})`}
                  >
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{localTime}</span>
                    <span className="text-[9px] text-emerald-400/80 font-normal uppercase">({tzAbbr})</span>
                  </div>

                  {/* GMT Standard Time */}
                  <div
                    className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-800/90 border border-slate-700 text-slate-300 font-medium"
                    title="Greenwich Mean Time (GMT / UTC benchmark)"
                  >
                    <Globe className="w-3 h-3 text-sky-400" />
                    <span>{gmtTime}</span>
                  </div>
                </div>
              </div>

              {/* Event Name */}
              <div className="font-semibold text-slate-100 text-xs sm:text-[13px] flex items-center justify-between">
                <span>{ev.event}</span>
                {ev.status === 'COMPLETED' ? (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                    <CheckCircle2 className="w-3 h-3" /> Released
                  </span>
                ) : (
                  <span className="text-[10px] text-amber-400/80 font-mono">
                    Pending
                  </span>
                )}
              </div>

              {/* Forecast & Previous Metrics */}
              <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-slate-400 bg-[#0b101d] px-3 py-1.5 rounded-lg border border-slate-800/60">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">Forecast:</span>
                  <span className="text-slate-100 font-bold">{ev.forecast}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">Previous:</span>
                  <span className="text-slate-300">{ev.previous}</span>
                </div>
                {ev.actual && (
                  <div className="flex items-center gap-1.5 ml-auto">
                    <span className="text-emerald-400 font-bold">Actual:</span>
                    <span className="text-emerald-300 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                      {ev.actual}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Note */}
      <div className="px-4 py-2.5 bg-[#090d18] border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono">
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-cyan-400" />
          <span>Local device clocks automatically synchronized. Volatility spike expected ±15m around releases.</span>
        </div>
      </div>
    </div>
  );
};
