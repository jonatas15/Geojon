import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { useDashboard } from '../context/DashboardContext';
import { GRADE_CONFIG, GRADE_ORDER } from '../config/grades';

const TOOLTIP_STYLE = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  color: 'var(--text-primary)',
  fontSize: '12px',
  boxShadow: 'var(--shadow)',
};

const SHORT_LABELS = {
  'Muito Alto': 'Mto Alto',
  'Alto': 'Alto',
  'Médio': 'Médio',
  'Baixo': 'Baixo',
  'Ocorrência Improvável': 'Improvável',
};

function useChartData() {
  const { stats, visibleGrades, activeGrades } = useDashboard();
  return GRADE_ORDER.map(grade => ({
    grade,
    short: SHORT_LABELS[grade] ?? grade,
    count: stats[grade] ?? 0,
    color: GRADE_CONFIG[grade]?.fillColor ?? '#999',
    visible: visibleGrades.has(grade),
    active: activeGrades.has(grade),
    dimmed: activeGrades.size > 0 && !activeGrades.has(grade),
  }));
}

export function PieChartView() {
  const { setSelectedGrade } = useDashboard();
  const data = useChartData().filter(d => d.count > 0);

  const handleClick = (entry) => {
    setSelectedGrade(entry.grade);
  };

  const renderLabel = ({ cx, cy, midAngle, outerRadius, percent, grade }) => {
    if (percent < 0.05) return null;
    const RADIAN = Math.PI / 180;
    const r = outerRadius + 18;
    const x = cx + r * Math.cos(-midAngle * RADIAN);
    const y = cy + r * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} fill="var(--text-secondary)" textAnchor={x > cx ? 'start' : 'end'} fontSize={10}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="chart-block">
      <h4 className="chart-title">Distribuição por Grau</h4>
      <ResponsiveContainer width="100%" height={210}>
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="grade"
            cx="50%"
            cy="48%"
            outerRadius={72}
            onClick={handleClick}
            cursor="pointer"
            labelLine={false}
            label={renderLabel}
          >
            {data.map(d => (
              <Cell
                key={d.grade}
                fill={d.color}
                opacity={d.dimmed ? 0.25 : 1}
                stroke={d.active ? '#fff' : 'transparent'}
                strokeWidth={d.active ? 3 : 0}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            itemStyle={{ color: 'var(--text-primary)' }}
            formatter={(val, name) => [val.toLocaleString('pt-BR'), name]}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BarChartView() {
  const { setSelectedGrade } = useDashboard();
  const data = useChartData();

  const handleClick = (barData) => {
    setSelectedGrade(barData.grade);
  };

  return (
    <div className="chart-block">
      <h4 className="chart-title">Polígonos por Grau</h4>
      <ResponsiveContainer width="100%" height={190}>
        <BarChart data={data} margin={{ top: 4, right: 8, bottom: 28, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="short"
            tick={{ fill: 'var(--text-secondary)', fontSize: 10 }}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={false}
            angle={-30}
            textAnchor="end"
            interval={0}
          />
          <YAxis
            tick={{ fill: 'var(--text-secondary)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={38}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            cursor={{ fill: 'var(--layer-hover)' }}
            formatter={(val, _, props) => [val.toLocaleString('pt-BR'), props.payload.grade]}
            labelFormatter={() => ''}
          />
          <Bar
            dataKey="count"
            radius={[5, 5, 0, 0]}
            onClick={handleClick}
            cursor="pointer"
          >
            {data.map(d => (
              <Cell
                key={d.grade}
                fill={d.color}
                opacity={d.dimmed ? 0.22 : !d.visible ? 0.15 : 1}
                stroke={d.active ? 'var(--text-primary)' : 'transparent'}
                strokeWidth={d.active ? 1.5 : 0}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
