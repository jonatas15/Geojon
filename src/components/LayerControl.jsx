import { useDashboard } from '../context/DashboardContext';
import { GRADE_CONFIG, GRADE_ORDER } from '../config/grades';

export default function LayerControl() {
  const {
    visibleGrades, toggleGrade, toggleAll,
    stats, activeGrades, setSelectedGrade,
  } = useDashboard();

  const allVisible = GRADE_ORDER.every(g => visibleGrades.has(g));
  const noneVisible = GRADE_ORDER.every(g => !visibleGrades.has(g));

  return (
    <div className="layer-control">
      <div className="layer-toggle-all">
        <button
          className={`toggle-btn ${allVisible ? 'active' : ''}`}
          onClick={() => toggleAll(true)}
        >
          Mostrar todos
        </button>
        <button
          className={`toggle-btn ${noneVisible ? 'active' : ''}`}
          onClick={() => toggleAll(false)}
        >
          Ocultar todos
        </button>
      </div>

      {GRADE_ORDER.map(grade => {
        const cfg = GRADE_CONFIG[grade];
        const count = stats[grade] ?? 0;
        const visible = visibleGrades.has(grade);
        const isSelected = activeGrades.has(grade);

        return (
          <div
            key={grade}
            className={`layer-item ${isSelected ? 'selected' : ''} ${!visible ? 'faded' : ''}`}
            onClick={() => setSelectedGrade(grade)}
            title="Clique para destacar no mapa e nos gráficos"
          >
            <label
              className="layer-checkbox"
              onClick={e => e.stopPropagation()}
              title="Mostrar/ocultar camada"
            >
              <input
                type="checkbox"
                checked={visible}
                onChange={() => toggleGrade(grade)}
              />
              <span className="layer-dot" style={{ background: cfg.fillColor }} />
            </label>
            <span className="layer-label">{cfg.label}</span>
            <span className="layer-badge">{count.toLocaleString('pt-BR')}</span>
          </div>
        );
      })}
    </div>
  );
}
