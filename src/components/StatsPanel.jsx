import { useDashboard } from '../context/DashboardContext';
import { GRADE_ORDER } from '../config/grades';

export default function StatsPanel() {
  const { stats, totalVisible, visibleGrades, geojsonData } = useDashboard();

  const total = geojsonData?.features.length ?? 0;

  return (
    <div className="stats-panel">
      <h4 className="section-title">Resumo</h4>
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-value">{total.toLocaleString('pt-BR')}</span>
          <span className="stat-label">Total</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{totalVisible.toLocaleString('pt-BR')}</span>
          <span className="stat-label">Visíveis</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{visibleGrades.size}</span>
          <span className="stat-label">Camadas ativas</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{GRADE_ORDER.length}</span>
          <span className="stat-label">Total camadas</span>
        </div>
      </div>
    </div>
  );
}
