import React from 'react';
import { CurrencyConfig, QuoteBreakdown } from '../types/graphic';
import {
  TrendingUp,
  DollarSign,
  Percent,
  BadgePercent,
  Calculator,
  ShieldCheck,
  Check,
  RotateCcw,
} from 'lucide-react';

interface CommercialMarginCommissionPanelProps {
  profitMarginPercent: number;
  profitMarginAmount?: number;
  profitMarginMode?: 'percent' | 'manual_amount';
  commissionPercent?: number;
  commissionAmount?: number;
  commissionMode?: 'percent' | 'manual_amount';
  taxPercent: number;
  totalProductionCost: number;
  breakdown: QuoteBreakdown;
  currency: CurrencyConfig;
  onChange: (updates: {
    profitMarginPercent: number;
    profitMarginAmount?: number;
    profitMarginMode?: 'percent' | 'manual_amount';
    commissionPercent?: number;
    commissionAmount?: number;
    commissionMode?: 'percent' | 'manual_amount';
    taxPercent: number;
  }) => void;
  className?: string;
}

export const CommercialMarginCommissionPanel: React.FC<CommercialMarginCommissionPanelProps> = ({
  profitMarginPercent,
  profitMarginAmount = 0,
  profitMarginMode = 'percent',
  commissionPercent = 0,
  commissionAmount = 0,
  commissionMode = 'percent',
  taxPercent,
  totalProductionCost,
  breakdown,
  currency,
  onChange,
  className = '',
}) => {
  // Valores calculados actuales
  const currentProfitAmount =
    profitMarginMode === 'manual_amount' && profitMarginAmount !== undefined && profitMarginAmount >= 0
      ? profitMarginAmount
      : totalProductionCost * ((profitMarginPercent || 0) / 100);

  const currentProfitPercent =
    totalProductionCost > 0
      ? Number(((currentProfitAmount / totalProductionCost) * 100).toFixed(2))
      : profitMarginPercent || 0;

  const baseForCommission = totalProductionCost + currentProfitAmount;

  const currentCommissionAmount =
    commissionMode === 'manual_amount' && commissionAmount !== undefined && commissionAmount >= 0
      ? commissionAmount
      : baseForCommission * ((commissionPercent || 0) / 100);

  const currentCommissionPercent =
    baseForCommission > 0
      ? Number(((currentCommissionAmount / baseForCommission) * 100).toFixed(2))
      : commissionPercent || 0;

  // Handlers para Margen Comercial / Utilidad
  const handleProfitPercentChange = (valPercent: number) => {
    const cleanPercent = Math.max(0, valPercent);
    const calculatedAmount = totalProductionCost * (cleanPercent / 100);
    onChange({
      profitMarginPercent: cleanPercent,
      profitMarginAmount: Number(calculatedAmount.toFixed(2)),
      profitMarginMode: 'percent',
      commissionPercent,
      commissionAmount,
      commissionMode,
      taxPercent,
    });
  };

  const handleProfitAmountChange = (valAmount: number) => {
    const cleanAmount = Math.max(0, valAmount);
    const calculatedPercent =
      totalProductionCost > 0 ? Number(((cleanAmount / totalProductionCost) * 100).toFixed(2)) : 0;
    onChange({
      profitMarginPercent: calculatedPercent,
      profitMarginAmount: cleanAmount,
      profitMarginMode: 'manual_amount',
      commissionPercent,
      commissionAmount,
      commissionMode,
      taxPercent,
    });
  };

  // Handlers para Comisión Comercial
  const handleCommissionPercentChange = (valPercent: number) => {
    const cleanPercent = Math.max(0, valPercent);
    const calculatedAmount = baseForCommission * (cleanPercent / 100);
    onChange({
      profitMarginPercent,
      profitMarginAmount,
      profitMarginMode,
      commissionPercent: cleanPercent,
      commissionAmount: Number(calculatedAmount.toFixed(2)),
      commissionMode: 'percent',
      taxPercent,
    });
  };

  const handleCommissionAmountChange = (valAmount: number) => {
    const cleanAmount = Math.max(0, valAmount);
    const calculatedPercent =
      baseForCommission > 0 ? Number(((cleanAmount / baseForCommission) * 100).toFixed(2)) : 0;
    onChange({
      profitMarginPercent,
      profitMarginAmount,
      profitMarginMode,
      commissionPercent: calculatedPercent,
      commissionAmount: cleanAmount,
      commissionMode: 'manual_amount',
      taxPercent,
    });
  };

  const handleTaxChange = (valTax: number) => {
    onChange({
      profitMarginPercent,
      profitMarginAmount,
      profitMarginMode,
      commissionPercent,
      commissionAmount,
      commissionMode,
      taxPercent: Math.max(0, valTax),
    });
  };

  // Chips rápidos comunes
  const profitPresetChips = [15, 20, 25, 30, 35, 40, 50];
  const commissionPresetChips = [0, 3, 5, 8, 10, 15];

  return (
    <div className={`bg-slate-950/90 rounded-2xl border border-slate-800 p-4 shadow-xl space-y-4 text-xs select-none ${className}`}>
      {/* Header del Bloque */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-100 flex items-center gap-1.5">
              <span>Margen Comercial, Utilidad & Comisión</span>
              <span className="text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
                Manual / %
              </span>
            </h4>
            <span className="text-[10px] text-slate-400">
              Ajuste directo de rentabilidad de imprenta y comisión de ventas
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* ========================================================= */}
        {/* SECCIÓN 1: MARGEN COMERCIAL / UTILIDAD                    */}
        {/* ========================================================= */}
        <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
              <BadgePercent className="w-3.5 h-3.5" />
              <span>Margen Comercial / Utilidad</span>
            </span>
            <span
              className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                profitMarginMode === 'manual_amount'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}
            >
              {profitMarginMode === 'manual_amount' ? 'Fijado por Monto $' : 'Fijado por %'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Entrada en Porcentaje (%) */}
            <div>
              <label className="text-[10px] text-slate-400 font-medium block mb-1">
                Porcentaje (%):
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="1000"
                  step="0.5"
                  value={currentProfitPercent}
                  onChange={(e) => handleProfitPercentChange(parseFloat(e.target.value) || 0)}
                  className={`w-full bg-slate-950 border rounded-lg pl-2 pr-6 py-1.5 text-xs font-mono font-bold outline-none transition-all ${
                    profitMarginMode === 'percent'
                      ? 'border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/30'
                      : 'border-slate-700 text-slate-300 focus:border-emerald-500'
                  }`}
                  placeholder="30"
                />
                <span className="absolute right-2 top-2 text-[10px] font-mono text-slate-500 pointer-events-none">
                  %
                </span>
              </div>
            </div>

            {/* Entrada Manual en Monto ($) */}
            <div>
              <label className="text-[10px] text-slate-400 font-medium block mb-1">
                Monto Manual ({currency.symbol}):
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={Math.round(currentProfitAmount * 100) / 100}
                  onChange={(e) => handleProfitAmountChange(parseFloat(e.target.value) || 0)}
                  className={`w-full bg-slate-950 border rounded-lg pl-2 pr-6 py-1.5 text-xs font-mono font-bold outline-none transition-all ${
                    profitMarginMode === 'manual_amount'
                      ? 'border-amber-400 text-amber-300 ring-1 ring-amber-400/30'
                      : 'border-slate-700 text-slate-300 focus:border-amber-400'
                  }`}
                  placeholder="0.00"
                />
                <span className="absolute right-2 top-2 text-[10px] font-mono text-slate-500 pointer-events-none">
                  {currency.symbol}
                </span>
              </div>
            </div>
          </div>

          {/* Preset Chips rápidos de Margen */}
          <div className="flex items-center gap-1 flex-wrap pt-0.5">
            <span className="text-[9px] text-slate-500 mr-0.5">Rápidos:</span>
            {profitPresetChips.map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => handleProfitPercentChange(pct)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                  profitMarginMode === 'percent' && currentProfitPercent === pct
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {pct}%
              </button>
            ))}
          </div>

          {/* Resultado de Utilidad */}
          <div className="pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Ganancia calculada:</span>
            <span className="font-mono font-bold text-emerald-400">
              +{currency.symbol}
              {currentProfitAmount.toLocaleString(undefined, {
                minimumFractionDigits: currency.decimals,
                maximumFractionDigits: currency.decimals,
              })}
            </span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECCIÓN 2: COMISIÓN COMERCIAL                             */}
        {/* ========================================================= */}
        <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-indigo-400 flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5" />
              <span>Comisión Comercial</span>
            </span>
            <span
              className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                commissionMode === 'manual_amount'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
              }`}
            >
              {commissionMode === 'manual_amount' ? 'Fijado por Monto $' : 'Fijado por %'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Entrada en Porcentaje (%) */}
            <div>
              <label className="text-[10px] text-slate-400 font-medium block mb-1">
                Comisión (%):
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={currentCommissionPercent}
                  onChange={(e) => handleCommissionPercentChange(parseFloat(e.target.value) || 0)}
                  className={`w-full bg-slate-950 border rounded-lg pl-2 pr-6 py-1.5 text-xs font-mono font-bold outline-none transition-all ${
                    commissionMode === 'percent'
                      ? 'border-indigo-500 text-indigo-300 ring-1 ring-indigo-500/30'
                      : 'border-slate-700 text-slate-300 focus:border-indigo-500'
                  }`}
                  placeholder="0"
                />
                <span className="absolute right-2 top-2 text-[10px] font-mono text-slate-500 pointer-events-none">
                  %
                </span>
              </div>
            </div>

            {/* Entrada Manual en Monto ($) */}
            <div>
              <label className="text-[10px] text-slate-400 font-medium block mb-1">
                Monto Manual ({currency.symbol}):
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={Math.round(currentCommissionAmount * 100) / 100}
                  onChange={(e) => handleCommissionAmountChange(parseFloat(e.target.value) || 0)}
                  className={`w-full bg-slate-950 border rounded-lg pl-2 pr-6 py-1.5 text-xs font-mono font-bold outline-none transition-all ${
                    commissionMode === 'manual_amount'
                      ? 'border-amber-400 text-amber-300 ring-1 ring-amber-400/30'
                      : 'border-slate-700 text-slate-300 focus:border-amber-400'
                  }`}
                  placeholder="0.00"
                />
                <span className="absolute right-2 top-2 text-[10px] font-mono text-slate-500 pointer-events-none">
                  {currency.symbol}
                </span>
              </div>
            </div>
          </div>

          {/* Preset Chips rápidos de Comisión */}
          <div className="flex items-center gap-1 flex-wrap pt-0.5">
            <span className="text-[9px] text-slate-500 mr-0.5">Rápidos:</span>
            {commissionPresetChips.map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => handleCommissionPercentChange(pct)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                  commissionMode === 'percent' && currentCommissionPercent === pct
                    ? 'bg-indigo-500 text-white font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {pct}%
              </button>
            ))}
          </div>

          {/* Resultado de Comisión */}
          <div className="pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Comisión estimada:</span>
            <span className="font-mono font-bold text-indigo-400">
              +{currency.symbol}
              {currentCommissionAmount.toLocaleString(undefined, {
                minimumFractionDigits: currency.decimals,
                maximumFractionDigits: currency.decimals,
              })}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECCIÓN 3: IMPUESTO / IVA & RESUMEN FINANCIERO TOTAL      */}
      {/* ========================================================= */}
      <div className="bg-slate-900/60 rounded-xl border border-slate-800/80 p-3 space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          {/* Input de IVA */}
          <div className="flex items-center gap-2">
            <label className="text-[11px] text-slate-300 font-medium whitespace-nowrap">
              Impuesto / IVA:
            </label>
            <div className="relative w-24">
              <input
                type="number"
                min="0"
                max="50"
                value={taxPercent}
                onChange={(e) => handleTaxChange(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200 font-mono font-bold outline-none focus:border-amber-400"
              />
              <span className="absolute right-2 top-1.5 text-[10px] font-mono text-slate-500 pointer-events-none">
                %
              </span>
            </div>
            <div className="flex items-center gap-1">
              {[0, 5, 10, 21].map((tx) => (
                <button
                  key={tx}
                  type="button"
                  onClick={() => handleTaxChange(tx)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono cursor-pointer ${
                    taxPercent === tx
                      ? 'bg-slate-700 text-amber-300 font-bold border border-amber-400/40'
                      : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tx}%
                </button>
              ))}
            </div>
          </div>

          {/* Subtotal Neto sin Impuesto */}
          <div className="text-right text-[11px] font-mono text-slate-300">
            <span className="text-slate-400 font-sans mr-1">Subtotal Neto:</span>
            <span className="font-bold">
              {currency.symbol}
              {breakdown.subtotalWithProfit.toLocaleString(undefined, {
                minimumFractionDigits: currency.decimals,
                maximumFractionDigits: currency.decimals,
              })}
            </span>
          </div>
        </div>

        {/* Resumen Detallado de Cotización */}
        <div className="pt-2 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[10px]">
          <div className="bg-slate-950/70 p-1.5 rounded-lg border border-slate-800/80">
            <span className="text-slate-400 block">Costo Fabril</span>
            <span className="font-mono font-bold text-sky-400 text-xs">
              {currency.symbol}
              {breakdown.totalProductionCost.toLocaleString(undefined, {
                minimumFractionDigits: currency.decimals,
                maximumFractionDigits: currency.decimals,
              })}
            </span>
          </div>

          <div className="bg-slate-950/70 p-1.5 rounded-lg border border-slate-800/80">
            <span className="text-slate-400 block">Utilidad ({currentProfitPercent}%)</span>
            <span className="font-mono font-bold text-emerald-400 text-xs">
              +{currency.symbol}
              {currentProfitAmount.toLocaleString(undefined, {
                minimumFractionDigits: currency.decimals,
                maximumFractionDigits: currency.decimals,
              })}
            </span>
          </div>

          <div className="bg-slate-950/70 p-1.5 rounded-lg border border-slate-800/80">
            <span className="text-slate-400 block">Comisión ({currentCommissionPercent}%)</span>
            <span className="font-mono font-bold text-indigo-400 text-xs">
              +{currency.symbol}
              {currentCommissionAmount.toLocaleString(undefined, {
                minimumFractionDigits: currency.decimals,
                maximumFractionDigits: currency.decimals,
              })}
            </span>
          </div>

          <div className="bg-slate-950/70 p-1.5 rounded-lg border border-slate-800/80">
            <span className="text-slate-400 block">IVA ({taxPercent}%)</span>
            <span className="font-mono font-bold text-slate-300 text-xs">
              +{currency.symbol}
              {breakdown.taxAmount.toLocaleString(undefined, {
                minimumFractionDigits: currency.decimals,
                maximumFractionDigits: currency.decimals,
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
