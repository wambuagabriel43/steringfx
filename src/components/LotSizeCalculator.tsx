import React, { useState } from 'react';
import { ForexPair, PairQuote } from '../types.ts';
import { Sliders, Calculator, Shield, DollarSign, ArrowRight } from 'lucide-react';

interface LotSizeCalculatorProps {
  pair: ForexPair;
  quote?: PairQuote;
  defaultStopLossPips?: number;
}

export const LotSizeCalculator: React.FC<LotSizeCalculatorProps> = ({
  pair,
  quote,
  defaultStopLossPips = 30,
}) => {
  const [accountBalance, setAccountBalance] = useState<number>(10000);
  const [riskPercent, setRiskPercent] = useState<number>(1.5);
  const [stopLossPips, setStopLossPips] = useState<number>(defaultStopLossPips);
  const [accountCurrency, setAccountCurrency] = useState<string>('USD');

  // Lot Calculation Math
  const riskAmount = (accountBalance * riskPercent) / 100;
  
  // Standard pip value for 1.0 standard lot (~$10 per pip on EURUSD, GBPUSD, etc.)
  const pipValuePerStandardLot = 10;
  const totalPipsRiskValue = stopLossPips * pipValuePerStandardLot;
  const calculatedLotSize = totalPipsRiskValue > 0 ? Number((riskAmount / totalPipsRiskValue).toFixed(2)) : 0.10;
  const miniLots = (calculatedLotSize * 10).toFixed(1);
  const microLots = (calculatedLotSize * 100).toFixed(0);

  return (
    <div className="bg-[#0e1424] border border-slate-800 rounded-xl overflow-hidden shadow-lg flex flex-col">
      <div className="px-4 py-3 bg-[#12192d] border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-xs text-white font-mono uppercase tracking-wider">
            Forex Position Size & Risk Calculator
          </span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
          {pair}
        </span>
      </div>

      <div className="p-4 space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Account Balance */}
          <div className="space-y-1">
            <label className="text-[11px] font-mono text-slate-400">Account Balance ($)</label>
            <input
              type="number"
              value={accountBalance}
              onChange={(e) => setAccountBalance(Math.max(100, parseFloat(e.target.value) || 1000))}
              className="w-full bg-[#090d18] border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Risk % */}
          <div className="space-y-1">
            <label className="text-[11px] font-mono text-slate-400">Risk % ({riskPercent}%)</label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              max="10.0"
              value={riskPercent}
              onChange={(e) => setRiskPercent(parseFloat(e.target.value) || 1.0)}
              className="w-full bg-[#090d18] border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Stop Loss (Pips) */}
          <div className="space-y-1">
            <label className="text-[11px] font-mono text-slate-400">Stop Loss Distance (Pips)</label>
            <input
              type="number"
              value={stopLossPips}
              onChange={(e) => setStopLossPips(Math.max(5, parseFloat(e.target.value) || 30))}
              className="w-full bg-[#090d18] border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Calculated Results Box */}
        <div className="p-4 rounded-xl bg-[#090d18] border border-emerald-500/30 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div>
            <div className="text-[10px] font-mono text-slate-400 uppercase">Risk Amount</div>
            <div className="text-base font-extrabold font-mono text-rose-400 mt-0.5">
              ${riskAmount.toFixed(2)}
            </div>
            <div className="text-[10px] text-slate-500">{riskPercent}% of balance</div>
          </div>

          <div>
            <div className="text-[10px] font-mono text-slate-400 uppercase">Standard Lots</div>
            <div className="text-xl font-black font-mono text-emerald-400 mt-0.5">
              {calculatedLotSize}
            </div>
            <div className="text-[10px] text-slate-400">100,000 Units</div>
          </div>

          <div>
            <div className="text-[10px] font-mono text-slate-400 uppercase">Mini Lots</div>
            <div className="text-base font-bold font-mono text-slate-200 mt-0.5">
              {miniLots}
            </div>
            <div className="text-[10px] text-slate-500">10,000 Units</div>
          </div>

          <div>
            <div className="text-[10px] font-mono text-slate-400 uppercase">Micro Lots</div>
            <div className="text-base font-bold font-mono text-slate-200 mt-0.5">
              {microLots}
            </div>
            <div className="text-[10px] text-slate-500">1,000 Units</div>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 justify-center">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>Calculated with 1:100 leverage standard pip values for {pair}.</span>
        </div>
      </div>
    </div>
  );
};
