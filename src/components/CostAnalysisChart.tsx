import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from 'recharts';
import { CurrencyConfig, QuoteBreakdown } from '../types/graphic';
import { BarChart3, PieChart, TrendingUp, DollarSign, Layers, Clock, Palette } from 'lucide-react';

interface CostAnalysisChartProps {
  breakdown: QuoteBreakdown;
  currency: CurrencyConfig;
}

export const CostAnalysisChart: React.FC<CostAnalysisChartProps> = ({
  breakdown,
  currency,
}) => {
  const [chartType, setChartType] = useState<'standard' | 'stacked'>('standard');

  const laborAndMachineCost = Number(
    (breakdown.machineTimeCost + breakdown.finishingsCost + breakdown.platesCost).toFixed(2)
  );

  const totalBase = breakdown.finalTotalPrice > 0 ? breakdown.finalTotalPrice : 1;

  const data = [
    {
      name: 'Papel / Sustrato',
      cost: breakdown.substrateCost,
      percentage: Number(((breakdown.substrateCost / totalBase) * 100).toFixed(1)),
      color: '#38bdf8', // sky-400
      icon: Layers,
      description: 'Materia prima, bobina y pliegos brutos',
    },
    {
      name: 'Consumo de Tinta',
      cost: breakdown.inkCost,
      percentage: Number(((breakdown.inkCost / totalBase) * 100).toFixed(1)),
      color: '#e879f9', // fuchsia-400
      icon: Palette,
      description: 'Gramos por m² según cobertura CMYK y directas',
    },
    {
      name: 'Mano de Obra & Taller',
      cost: laborAndMachineCost,
      percentage: Number(((laborAndMachineCost / totalBase) * 100).toFixed(1)),
      color: '#fbbf24', // amber-400
      icon: Clock,
      description: 'Tiempo máquina Aravo, acabados y matrices',
    },
    {
      name: 'Margen de Utilidad',
      cost: breakdown.profitAmount,
      percentage: Number(((breakdown.profitAmount / totalBase) * 100).toFixed(1)),
      color: '#34d399', // emerald-400
      icon: TrendingUp,
      description: 'Beneficio neto industrial del taller',
    },
  ];

  const formatCurrency = (val: number) => {
    return `${currency.symbol}${val.toLocaleString(undefined, {
      minimumFractionDigits: currency.decimals,
      maximumFractionDigits: currency.decimals,
    })}`;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs space-y-1 z-50">
          <div className="font-bold text-slate-100 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            <span>{item.name}</span>
          </div>
          <div className="text-slate-400 text-[11px]">{item.description}</div>
          <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between gap-4 font-mono">
            <span className="text-slate-300">Monto:</span>
            <span className="font-bold text-slate-100">{formatCurrency(item.cost)}</span>
          </div>
          <div className="flex items-center justify-between gap-4 font-mono">
            <span className="text-slate-300">Incidencia:</span>
            <span className="font-bold text-amber-400">{item.percentage}% del total</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <span>Análisis Comparativo de Costos</span>
            </h3>
            <p className="text-xs text-slate-400">
              Desglose gráfico de insumos (papel, tinta), maquinado / mano de obra y margen de utilidad.
            </p>
          </div>
        </div>

        {/* Total Cost Badge */}
        <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono self-start sm:self-auto">
          <span className="text-slate-400">Total Cotizado:</span>
          <span className="font-bold text-amber-400">{formatCurrency(breakdown.finalTotalPrice)}</span>
        </div>
      </div>

      {/* KPI Incidence Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        {data.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.name}
              className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex flex-col justify-between gap-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium text-[11px] truncate">{item.name}</span>
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
              </div>

              <div>
                <div className="text-base font-bold font-mono text-slate-100">
                  {formatCurrency(item.cost)}
                </div>
                <div className="flex items-center justify-between mt-1 text-[11px]">
                  <span className="text-slate-500 font-mono">Participación:</span>
                  <span className="font-bold font-mono" style={{ color: item.color }}>
                    {item.percentage}%
                  </span>
                </div>
              </div>

              {/* Mini progress bar */}
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, item.percentage)}%`, backgroundColor: item.color }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Recharts Bar Chart Container */}
      <div className="bg-slate-950/90 rounded-xl border border-slate-800 p-4 h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 15, right: 15, left: 10, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
            <XAxis
              dataKey="name"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#475569' }}
              interval={0}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#475569' }}
              tickFormatter={(v) => `${currency.symbol}${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="cost" radius={[6, 6, 0, 0]} maxBarSize={60}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Analytical Insights summary */}
      <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            El costo directo de insumos (Papel + Tinta) representa el{' '}
            <strong className="text-slate-200 font-mono">
              {(data[0].percentage + data[1].percentage).toFixed(1)}%
            </strong>{' '}
            del valor total cotizado.
          </span>
        </div>

        <div className="flex items-center gap-4 text-[11px] font-mono shrink-0">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-400" />
            Papel ({data[0].percentage}%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            Taller ({data[2].percentage}%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Margen ({data[3].percentage}%)
          </span>
        </div>
      </div>
    </div>
  );
};
