import LayerControl from './LayerControl';
import StatsPanel from './StatsPanel';
import InfoPanel from './InfoPanel';
import { PieChartView, BarChartView } from './Charts';

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-section">
        <h4 className="section-title">Camadas de Potencialidade</h4>
        <LayerControl />
      </div>

      <div className="sidebar-section">
        <StatsPanel />
      </div>

      <InfoPanel />

      <div className="sidebar-section">
        <PieChartView />
      </div>

      <div className="sidebar-section">
        <BarChartView />
      </div>

      <div className="sidebar-footer">
        <p>Fonte: Jansen, Cavalcanti &amp; Lamblém (2012) · RBEsp v.2 n.1</p>
      </div>
    </aside>
  );
}
