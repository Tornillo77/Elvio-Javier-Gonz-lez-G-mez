import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceDot,
  ReferenceLine,
} from 'recharts';
import {
  CurrencyConfig,
  FlexoJobParams,
  OffsetJobParams,
  PrintTechnology,
  QuoteBreakdown,
} from '../types/graphic';
import { calculateImpositionOptions } from '../utils/imposition';
import { calculateOffsetQuote, calculateFlexoQuote } from '../utils/quoteCalculator';
import {
  TrendingDown,
  TrendingUp,
  Layers,
  Sparkles,
  ArrowRight,
  Info,
  DollarSign,
  Maximize2,
  Package,
} from 'lucide-react';

interface VolumeCostComparisonChartProps {
  technology: PrintTechnology;
  offsetParams: OffsetJobParams;
  flexoParams: FlexoJobParams;
  currentBreakdown: QuoteBreakdown;
  currency: CurrencyConfig;
  onApplyQuantity?: (newQuantity: number) => void;
}

export const VolumeCostComparisonChart: React.FC<VolumeCostComparisonChartProps> = ({
  technology,
  offsetParams,
  flexoParams,
  currentBreakdown,
  currency,
  onApplyQuantity,
}) => {
  const [viewMode, setViewMode] = useState<'unitPrice' | 'dual' | 'components'>('unitPrice');
  const isOffset = technology === 'offset';

  // Format currency helper
  const fmt = (val: number, decimals: number = currency.decimals) => {
    return `${currency.symbol}${val.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}`;
  };

  // Generate volume curve data points
  const volumeData = useMemo(() => {
    if (isOffset) {
      // Find current arrangement
      const opts = calculateImpositionOptions({
        sheetWidth: offsetParams.sheetWidthMm,
        sheetHeight: offsetParams.sheetHeightMm,
        pieceWidth: offsetParams.pieceWidthMm,
        pieceHeight: offsetParams.pieceHeightMm,
        bleed: offsetParams.bleedMm,
        gutter: offsetParams.gutterMm,
        gripperMargin: offsetParams.gripperMarginMm,
        nonGripperMargin: offsetParams.nonGripperMarginMm,
      });
      const activeArrangement = opts.optimal;

      const currentQty = offsetParams.quantityUnits;
      
      // Standard volume steps adapted to magnitude of the order
      const standardSteps = [500, 1000, 2000, 3000, 5000, 7500, 10000, 15000, 20000, 30000, 50000];
      
      // Merge currentQty if not already in list
      const allQtys = Array.from(new Set([...standardSteps, currentQty])).sort((a, b) => a - b);
      // Filter out reasonable range
      const minQty = Math.max(250, Math.min(allQtys[0], currentQty * 0.1));
      const maxQty = Math.max(allQtys[allQtys.length - 1], currentQty * 3);
      const filteredQtys = allQtys.filter((q) => q >= minQty && q <= maxQty);

      // Base minimum price for savings comparison
      const baseResult = calculateOffsetQuote(
        { ...offsetParams, quantityUnits: filteredQtys[0] },
        activeArrangement
      );
      const baseUnitPrice = baseResult.breakdown.pricePerUnit;

      return filteredQtys.map((qty) => {
        const tempParams: OffsetJobParams = {
          ...offsetParams,
          quantityUnits: qty,
        };
        const res = calculateOffsetQuote(tempParams, activeArrangement);
        const b = res.breakdown;
        const isCurrent = qty === currentQty;

        const platesUnit = b.platesCost / qty;
        const setupMachineUnit = (b.machineTimeCost * (b.setupTimeHours / Math.max(0.1, b.totalTimeHours))) / qty;
        const runningMachineUnit = (b.machineTimeCost * (b.runTimeHours / Math.max(0.1, b.totalTimeHours))) / qty;
        const paperUnit = b.substrateCost / qty;
        const inkUnit = b.inkCost / qty;
        const savingsPercent = baseUnitPrice > 0 ? Math.max(0, ((baseUnitPrice - b.pricePerUnit) / baseUnitPrice) * 100) : 0;

        return {
          quantity: qty,
          quantityLabel: qty >= 1000 ? `${(qty / 1000).toLocaleString()}k` : `${qty}`,
          unitPrice: b.pricePerUnit,
          pricePerThousand: b.pricePerThousand,
          totalPrice: b.finalTotalPrice,
          productionCost: b.totalProductionCost,
          platesUnit,
          setupMachineUnit,
          runningMachineUnit,
          paperUnit,
          inkUnit,
          savingsPercent: Number(savingsPercent.toFixed(1)),
          isCurrent,
        };
      });
    } else {
      // Flexo volume calculation
      const currentQty = flexoParams.targetQuantity;
      const steps = [200, 500, 1000, 2000, 5000, 10000];
      const allQtys = Array.from(new Set([...steps, currentQty])).sort((a, b) => a - b);

      const baseResult = calculateFlexoQuote({ ...flexoParams, targetQuantity: allQtys[0] });
      const baseUnitPrice = baseResult.breakdown.pricePerUnit;

      return allQtys.map((qty) => {
        const res = calculateFlexoQuote({ ...flexoParams, targetQuantity: qty });
        const b = res.breakdown;
        const isCurrent = qty === currentQty;
        const savingsPercent = baseUnitPrice > 0 ? Math.max(0, ((baseUnitPrice - b.pricePerUnit) / baseUnitPrice) * 100) : 0;

        return {
          quantity: qty,
          quantityLabel: `${qty} ${flexoParams.quoteUnit === 'units' ? 'etiq.' : flexoParams.quoteUnit}`,
          unitPrice: b.pricePerUnit,
          pricePerThousand: b.pricePerThousand,
          totalPrice: b.finalTotalPrice,
          productionCost: b.totalProductionCost,
          platesUnit: b.platesCost / qty,
          setupMachineUnit: (b.machineTimeCost * 0.4) / qty,
          runningMachineUnit: (b.machineTimeCost * 0.6) / qty,
          paperUnit: b.substrateCost / qty,
          inkUnit: b.inkCost / qty,
          savingsPercent: Number(savingsPercent.toFixed(1)),
          isCurrent,
        };
      });
    }
  }, [offsetParams, flexoParams, isOffset]);

  const currentPoint = volumeData.find((d) => d.isCurrent) || volumeData[0];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 p-3.5 rounded-xl shadow-2xl text-xs space-y-2 z-50 min-w-[220px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="font-bold text-slate-100 flex items-center gap-1.5 font-mono">
              <Package className="w-3.5 h-3.5 text-amber-400" />
              Tirada: {data.quantity.toLocaleString()}{' '}
              {isOffset ? 'unidades' : flexoParams.quoteUnit === 'units' ? 'etiquetas' : flexoParams.quoteUnit}
            </span>
            {data.isCurrent && (
              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px] border border-amber-500/30">
                ACTUAL
              </span>
            )}
          </div>

          <div className="space-y-1 font-mono">
            <div className="flex items-center justify-between text-slate-300">
              <span>Precio Unitario:</span>
              <span className="font-bold text-amber-300 text-sm">{fmt(data.unitPrice, 4)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span>Precio por Millar:</span>
              <span className="font-semibold text-slate-200">{fmt(data.pricePerThousand, 2)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400 text-[11px] pt-1 border-t border-slate-800/80">
              <span>Inversión Total:</span>
              <span className="font-bold text-emerald-400">{fmt(data.totalPrice, 2)}</span>
            </div>
            {data.savingsPercent > 0 && (
              <div className="flex items-center justify-between text-cyan-400 text-[11px]">
                <span>Ahorro por Escala:</span>
                <span className="font-bold">-{data.savingsPercent}%</span>
              </div>
            )}
          </div>

          {onApplyQuantity && !data.isCurrent && (
            <div className="pt-1.5 border-t border-slate-800 text-[10px] text-center text-slate-400">
              💡 Haz clic en el punto para simular esta tirada
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <span>Curva de Costo Unitario vs Volumen de Tirada</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 font-mono font-semibold">
                Recharts
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Amortización de matrices CTP y puesta a punto Aravo en función de la cantidad.
            </p>
          </div>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setViewMode('unitPrice')}
            className={`px-3 py-1.5 rounded-lg transition-all font-semibold ${
              viewMode === 'unitPrice'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Costo Unitario
          </button>
          <button
            type="button"
            onClick={() => setViewMode('components')}
            className={`px-3 py-1.5 rounded-lg transition-all font-semibold ${
              viewMode === 'components'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Desglose Unitario
          </button>
          <button
            type="button"
            onClick={() => setViewMode('dual')}
            className={`px-3 py-1.5 rounded-lg transition-all font-semibold ${
              viewMode === 'dual'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Unitario vs Total
          </button>
        </div>
      </div>

      {/* KPI Highlight Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
        <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
          <span className="text-[10px] text-slate-400 uppercase font-sans block">Tirada Actual</span>
          <span className="text-base font-bold text-amber-400">
            {currentPoint.quantity.toLocaleString()}{' '}
            {isOffset ? 'un.' : flexoParams.quoteUnit === 'units' ? 'etiq.' : flexoParams.quoteUnit}
          </span>
        </div>

        <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
          <span className="text-[10px] text-slate-400 uppercase font-sans block">Precio Unitario</span>
          <span className="text-base font-bold text-amber-300">
            {fmt(currentPoint.unitPrice, 4)}
          </span>
        </div>

        <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
          <span className="text-[10px] text-slate-400 uppercase font-sans block">Precio por Millar</span>
          <span className="text-base font-bold text-sky-400">
            {fmt(currentPoint.pricePerThousand, 2)}
          </span>
        </div>

        <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
          <span className="text-[10px] text-slate-400 uppercase font-sans block">Ahorro Máx. de Escala</span>
          <span className="text-base font-bold text-emerald-400">
            {volumeData[volumeData.length - 1]?.savingsPercent}% menos
          </span>
        </div>
      </div>

      {/* Main Recharts Area */}
      <div className="h-[280px] sm:h-[320px] w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === 'unitPrice' ? (
            <AreaChart
              data={volumeData}
              margin={{ top: 10, right: 20, left: 10, bottom: 20 }}
              onClick={(e: any) => {
                if (e?.activePayload?.[0]?.payload?.quantity && onApplyQuantity) {
                  onApplyQuantity(e.activePayload[0].payload.quantity);
                }
              }}
            >
              <defs>
                <linearGradient id="unitCostGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
              <XAxis
                dataKey="quantityLabel"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                dy={10}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                tickFormatter={(v) => `${currency.symbol}${v}`}
                domain={['auto', 'auto']}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="unitPrice"
                stroke="#f59e0b"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#unitCostGradient)"
                name="Precio Unitario"
              />
              {/* Highlight current point */}
              {currentPoint && (
                <ReferenceDot
                  x={currentPoint.quantityLabel}
                  y={currentPoint.unitPrice}
                  r={7}
                  fill="#f59e0b"
                  stroke="#ffffff"
                  strokeWidth={2}
                />
              )}
            </AreaChart>
          ) : viewMode === 'components' ? (
            <AreaChart
              data={volumeData}
              margin={{ top: 10, right: 20, left: 10, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
              <XAxis dataKey="quantityLabel" stroke="#94a3b8" fontSize={11} dy={10} />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickFormatter={(v) => `${currency.symbol}${v}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                iconType="circle"
              />
              <Area
                type="monotone"
                dataKey="paperUnit"
                stackId="1"
                stroke="#38bdf8"
                fill="#38bdf8"
                fillOpacity={0.7}
                name="Papel / Sustrato"
              />
              <Area
                type="monotone"
                dataKey="inkUnit"
                stackId="1"
                stroke="#e879f9"
                fill="#e879f9"
                fillOpacity={0.7}
                name="Tinta"
              />
              <Area
                type="monotone"
                dataKey="runningMachineUnit"
                stackId="1"
                stroke="#34d399"
                fill="#34d399"
                fillOpacity={0.7}
                name="Tiro Máquina"
              />
              <Area
                type="monotone"
                dataKey="platesUnit"
                stackId="1"
                stroke="#f59e0b"
                fill="#f59e0b"
                fillOpacity={0.8}
                name="Matrices CTP (Fijo)"
              />
              <Area
                type="monotone"
                dataKey="setupMachineUnit"
                stackId="1"
                stroke="#fb7185"
                fill="#fb7185"
                fillOpacity={0.8}
                name="Puesta a Punto (Fijo)"
              />
            </AreaChart>
          ) : (
            <AreaChart
              data={volumeData}
              margin={{ top: 10, right: 30, left: 10, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
              <XAxis dataKey="quantityLabel" stroke="#94a3b8" fontSize={11} dy={10} />
              <YAxis
                yAxisId="left"
                stroke="#f59e0b"
                fontSize={11}
                tickFormatter={(v) => `${currency.symbol}${v}`}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#34d399"
                fontSize={11}
                tickFormatter={(v) => `${currency.symbol}${v.toLocaleString()}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="unitPrice"
                stroke="#f59e0b"
                fill="#f59e0b"
                fillOpacity={0.2}
                strokeWidth={2.5}
                name="Precio Unitario (Izq)"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="totalPrice"
                stroke="#34d399"
                strokeWidth={2.5}
                name="Inversión Total (Der)"
                dot={false}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Suggested Run Scaling Quick Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs">
        <div className="flex items-center gap-2 text-slate-400">
          <Info className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            Observa cómo al duplicar la tirada, los costos fijos de plancha y puesta a punto se diluyen drásticamente.
          </span>
        </div>

        {onApplyQuantity && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-slate-400 font-sans">Simular Tirada:</span>
            {volumeData
              .filter((d) => !d.isCurrent)
              .slice(0, 4)
              .map((d) => (
                <button
                  key={`sim-${d.quantity}`}
                  type="button"
                  onClick={() => onApplyQuantity(d.quantity)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-mono font-bold text-[11px] transition-all hover:border-amber-400"
                >
                  {d.quantity.toLocaleString()} ({fmt(d.unitPrice, 2)}/u)
                </button>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};
