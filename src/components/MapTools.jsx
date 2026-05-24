import { useEffect, useState, useRef, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import '@geoman-io/leaflet-geoman-free';                         // estende L.Map com map.pm
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';

// ─── Geodésica ───────────────────────────────────────────────────
const R = 6371;

function haversine(a, b) {
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const h = Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function chainLength(pts) {
  let d = 0;
  for (let i = 1; i < pts.length; i++) d += haversine(pts[i - 1], pts[i]);
  return d;
}

function sphericalArea(pts) {
  let a = 0;
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    a += (pts[j].lng - pts[i].lng) * Math.PI / 180 *
      (Math.sin(pts[i].lat * Math.PI / 180) + Math.sin(pts[j].lat * Math.PI / 180));
  }
  return Math.abs(a) * R * R / 2;
}

function fmtDist(km) {
  return km < 1 ? `${(km * 1000).toFixed(0)} m` : `${km.toFixed(3)} km`;
}

function fmtArea(km2) {
  if (km2 < 0.0001) return `${(km2 * 1e6).toFixed(0)} m²`;
  if (km2 < 1) return `${(km2 * 100).toFixed(2)} ha`;
  return `${km2.toFixed(3)} km²`;
}

// ─── Definição das ferramentas ───────────────────────────────────
const TOOLS = [
  {
    id: 'measure',
    icon: '📏',
    label: 'Medir',
    title: 'Medir distância — clique para adicionar pontos, duplo-clique para finalizar',
  },
  {
    id: 'line',
    icon: '✏️',
    label: 'Traço',
    title: 'Desenhar linha — duplo-clique para finalizar',
  },
  {
    id: 'polygon',
    icon: '⬡',
    label: 'Polígono',
    title: 'Desenhar polígono com área — duplo-clique para fechar',
  },
  {
    id: 'erase',
    icon: '🗑',
    label: 'Apagar',
    title: 'Clique em um traço ou polígono para apagá-lo',
  },
];

export default function MapTools() {
  const map = useMap();
  const [activeTool, setActiveTool] = useState(null);
  const [live, setLive] = useState(null); // { text, x, y }

  const vertices = useRef([]);
  const isMeasure = useRef(false);
  // ── Geoman: eventos de criação e cancelamento ────────────────────
  useEffect(() => {
    if (!map.pm) return;
    map.pm.setGlobalOptions({ allowSelfIntersection: true });

    const onCreated = ({ shape, layer }) => {
      setActiveTool(null);
      setLive(null);
      vertices.current = [];

      if (shape === 'Line') {
        const pts = layer.getLatLngs().flat();
        const d = chainLength(pts);
        const segs = pts.length - 1;
        if (isMeasure.current) {
          layer.setStyle({ color: '#f59e0b', weight: 2, dashArray: '8 5', opacity: 0.95 });
          layer.bindPopup(
            `<div class="map-tooltip">
              <b>Distância medida</b><br>
              ${fmtDist(d)}
              <br><small>${segs} segmento${segs !== 1 ? 's' : ''}</small>
            </div>`
          ).openPopup();
        } else {
          layer.setStyle({ color: '#3b82f6', weight: 3, opacity: 1 });
          layer.bindPopup(
            `<div class="map-tooltip"><b>Traço</b><br>Comprimento: <b>${fmtDist(d)}</b></div>`
          );
        }
      } else if (shape === 'Polygon') {
        const pts = layer.getLatLngs()[0];
        const area = sphericalArea(pts);
        const perimeter = chainLength([...pts, pts[0]]);
        layer.setStyle({ color: '#7c3aed', fillColor: '#7c3aed', weight: 2, fillOpacity: 0.18 });
        layer.bindPopup(
          `<div class="map-tooltip">
            <b>Polígono</b><br>
            Área: <b>${fmtArea(area)}</b><br>
            Perímetro: ${fmtDist(perimeter)}
          </div>`
        );
      }

      isMeasure.current = false;
      map.pm.disableDraw();
    };

    const onDrawEnd = () => {
      setActiveTool(null);
      setLive(null);
      vertices.current = [];
      isMeasure.current = false;
      // Restaura interatividade do pane de dados
      map.getPane('overlayPane').style.pointerEvents = '';
      map.fire('maptool:deactivate');
    };

    map.on('pm:create', onCreated);
    map.on('pm:drawend', onDrawEnd);
    return () => {
      map.off('pm:create', onCreated);
      map.off('pm:drawend', onDrawEnd);
    };
  }, [map]);

  // ── Medição em tempo real durante o desenho ──────────────────────
  useEffect(() => {
    if (!activeTool || activeTool === 'erase') {
      return;
    }

    const onDrawStart = () => { vertices.current = []; };

    const onVertexAdded = ({ workingLayer }) => {
      if (workingLayer?.getLatLngs) {
        vertices.current = workingLayer.getLatLngs().flat();
      }
    };

    const onMouseMove = (e) => {
      const verts = vertices.current;
      if (!verts.length) return;

      const all = [...verts, e.latlng];
      let text = '';

      if (activeTool === 'measure' || activeTool === 'line') {
        const seg = haversine(verts[verts.length - 1], e.latlng);
        const total = chainLength(all);
        text = `segmento: ${fmtDist(seg)}   total: ${fmtDist(total)}`;
      } else if (activeTool === 'polygon') {
        if (all.length >= 3) {
          const area = sphericalArea(all);
          const perimeter = chainLength([...all, all[0]]);
          text = `Área ≈ ${fmtArea(area)}   Perímetro ≈ ${fmtDist(perimeter)}`;
        } else {
          text = `Distância: ${fmtDist(chainLength(all))}`;
        }
      }

      const pt = map.latLngToContainerPoint(e.latlng);
      setLive({ text, x: pt.x, y: pt.y });
    };

    map.on('pm:drawstart', onDrawStart);
    map.on('pm:vertexadded', onVertexAdded);
    map.on('mousemove', onMouseMove);

    return () => {
      map.off('pm:drawstart', onDrawStart);
      map.off('pm:vertexadded', onVertexAdded);
      map.off('mousemove', onMouseMove);
    };
  }, [activeTool, map]);

  // ── Cleanup ao desmontar ─────────────────────────────────────────
  useEffect(() => () => {
    map.getPane('overlayPane').style.pointerEvents = '';
    map.fire('maptool:deactivate');
  }, [map]);

  // ── Ativação / desativação de ferramentas ────────────────────────
  const activate = useCallback((id) => {
    map.pm.disableDraw();
    map.pm.disableGlobalRemovalMode();
    setLive(null);
    vertices.current = [];

    // Sempre restaura antes de reconfigurar
    map.getPane('overlayPane').style.pointerEvents = '';
    map.fire('maptool:deactivate');

    if (id === activeTool) {
      setActiveTool(null);
      return;
    }

    setActiveTool(id);

    switch (id) {
      case 'measure':
        isMeasure.current = true;
        // Desabilita cliques nos polígonos do shapefile durante o desenho
        map.getPane('overlayPane').style.pointerEvents = 'none';
        map.pm.enableDraw('Line', {
          hintlineStyle: { color: '#f59e0b', dashArray: '8 5' },
          templineStyle: { color: '#f59e0b', dashArray: '8 5' },
        });
        break;
      case 'line':
        map.getPane('overlayPane').style.pointerEvents = 'none';
        map.pm.enableDraw('Line', {
          hintlineStyle: { color: '#3b82f6' },
          templineStyle: { color: '#3b82f6' },
        });
        break;
      case 'polygon':
        map.getPane('overlayPane').style.pointerEvents = 'none';
        map.pm.enableDraw('Polygon', {
          hintlineStyle: { color: '#7c3aed' },
          templineStyle: { color: '#7c3aed' },
          pathOptions: { color: '#7c3aed', fillColor: '#7c3aed', fillOpacity: 0.15 },
        });
        break;
      case 'erase':
        // Erase precisa clicar nas camadas desenhadas → não desabilita o pane
        // Mas sinaliza para o GeoJSONLayer ignorar cliques nos dados
        map.fire('maptool:activate');
        map.pm.enableGlobalRemovalMode();
        break;
    }
  }, [activeTool, map]);

  const clearAll = useCallback(() => {
    map.pm.getGeomanLayers().forEach(l => l.remove());
  }, [map]);

  const printPage = useCallback(() => window.print(), []);

  return (
    <>
      {/* Barra de ferramentas flutuante */}
      <div className="map-toolbar">
        <div className="maptool-group">
          {TOOLS.map(t => (
            <button
              key={t.id}
              className={`maptool-btn ${activeTool === t.id ? 'active' : ''}`}
              title={t.title}
              onClick={() => activate(t.id)}
            >
              <span className="maptool-icon">{t.icon}</span>
              <span className="maptool-label">{t.label}</span>
            </button>
          ))}
        </div>

        <div className="maptool-sep" />

        <div className="maptool-group">
          <button
            className="maptool-btn"
            title="Limpar todos os traços e polígonos desenhados"
            onClick={clearAll}
          >
            <span className="maptool-icon">✕</span>
            <span className="maptool-label">Limpar</span>
          </button>
          <button
            className="maptool-btn maptool-save"
            title="Imprimir / salvar como PDF"
            onClick={printPage}
          >
            <span className="maptool-icon">🖨</span>
            <span className="maptool-label">Imprimir</span>
          </button>
        </div>
      </div>

      {/* Medição ao vivo — segue o cursor */}
      {live && (
        <div
          className="map-live-measure"
          style={{ transform: `translate(${live.x + 18}px, ${live.y - 16}px)` }}
        >
          {live.text}
        </div>
      )}
    </>
  );
}
