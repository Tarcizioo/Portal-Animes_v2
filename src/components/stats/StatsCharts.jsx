import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="max-w-[calc(100vw-2rem)] rounded-lg border border-border-color bg-bg-secondary p-3 shadow-xl">
      {label !== undefined && <p className="mb-1 font-bold text-text-primary">{label}</p>}
      <p className="text-sm text-primary">
        {payload[0].value} {payload[0].name === 'count' ? 'Animes' : ''}
      </p>
    </div>
  );
}

function ScoreTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="min-w-0 max-w-[calc(100vw-2rem)] rounded-lg border border-border-color bg-bg-secondary p-3 shadow-xl sm:min-w-[150px]">
      <p className="mb-2 border-b border-border-color pb-1 font-bold text-text-primary">Nota {label}</p>
      {payload.map((entry) => entry.value > 0 && (
        <div key={entry.dataKey} className="mb-1 flex items-center justify-between gap-3 text-xs last:mb-0">
          <span className="flex items-center gap-1 text-text-secondary">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
            {entry.name}
          </span>
          <span className="font-bold text-text-primary">{entry.value}</span>
        </div>
      ))}
      <div className="mt-2 flex justify-between border-t border-border-color pt-1 text-xs font-bold text-text-primary">
        <span>Total</span>
        <span>{payload.reduce((total, entry) => total + Number(entry.value), 0)}</span>
      </div>
    </div>
  );
}

function ChartContainer({ children, label }) {
  return (
    <div role="img" aria-label={label} className="h-full min-h-0 w-full min-w-0 overflow-hidden">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={50}>
        {children}
      </ResponsiveContainer>
    </div>
  );
}

export function StatusDistributionChart({ data }) {
  return (
    <ChartContainer label="Distribuição de títulos por status">
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={entry.fill || COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<ChartTooltip />} />
        <Legend iconSize={8} wrapperStyle={{ fontSize: '10px', lineHeight: '18px' }} />
      </PieChart>
    </ChartContainer>
  );
}

export function TypeDistributionChart({ data }) {
  return (
    <ChartContainer label="Distribuição de títulos por formato">
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" outerRadius={80} dataKey="value" stroke="none">
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<ChartTooltip />} />
        <Legend iconSize={8} wrapperStyle={{ fontSize: '10px', lineHeight: '18px' }} />
      </PieChart>
    </ChartContainer>
  );
}

export function ScoreDistributionChart({ data, detailed = false }) {
  return (
    <ChartContainer label="Distribuição das notas por status">
      <BarChart data={data} margin={detailed ? { top: 12, right: 4, left: -20, bottom: 12 } : undefined}>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.1} />
        <XAxis dataKey="score" stroke="#888" fontSize={detailed ? 10 : 12} tickLine={false} axisLine={false} />
        {detailed && <YAxis stroke="#888" fontSize={10} tickLine={false} axisLine={false} width={20} />}
        <Tooltip content={<ScoreTooltip />} cursor={{ fill: 'transparent' }} />
        <Legend iconSize={8} wrapperStyle={detailed ? { paddingTop: '12px', fontSize: '10px', lineHeight: '18px' } : { fontSize: '10px', lineHeight: '18px' }} />
        <Bar dataKey="watching" name="Assistindo" stackId="a" fill="#3b82f6" />
        <Bar dataKey="completed" name="Completo" stackId="a" fill="#10b981" />
        <Bar dataKey="plan_to_watch" name="Planejado" stackId="a" fill="#6366f1" />
        <Bar dataKey="paused" name="Pausado" stackId="a" fill="#f59e0b" />
        <Bar dataKey="dropped" name="Dropado" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
