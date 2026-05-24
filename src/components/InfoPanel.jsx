import { useDashboard } from '../context/DashboardContext';
import { GRADE_CONFIG } from '../config/grades';

export default function InfoPanel() {
  const { selectedFeatureId, geojsonData, setSelectedFeatureId } = useDashboard();

  if (selectedFeatureId === null || !geojsonData) return null;
  const feature = geojsonData.features.find(f => f.id === selectedFeatureId);
  if (!feature) return null;

  const { grau_de_po, count } = feature.properties;
  const cfg = GRADE_CONFIG[grau_de_po];

  return (
    <div className="sidebar-section" style={{ paddingTop: 0, paddingBottom: 14 }}>
    <div className="info-panel">
      <div className="info-panel-header">
        <h4 className="section-title" style={{ margin: 0 }}>Polígono #{selectedFeatureId}</h4>
        <button className="info-close" onClick={() => setSelectedFeatureId(null)} title="Fechar">✕</button>
      </div>
      <div className="info-grade-badge" style={{ background: cfg?.fillColor ?? '#999' }}>
        {grau_de_po}
      </div>
      <div className="info-row">
        <span className="info-label">Ocorrências registradas</span>
        <span className="info-value">{count ?? '–'}</span>
      </div>
    </div>
    </div>
  );
}
