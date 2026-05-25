import { useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, GeoJSON, Popup, useMap } from 'react-leaflet';
import MapTools from './MapTools';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useDashboard } from '../context/DashboardContext';
import { GRADE_CONFIG } from '../config/grades';

function parseMetodologia(text) {
  if (!text) return null;
  const m = text.match(/In:\s*(.+)/);
  return m ? m[1].trim().replace(/\)$/, '') : text.slice(0, 100) + '…';
}

function MapInfoWindow() {
  const { selectedFeatureId, clickLatLng, geojsonData, setSelectedFeatureId } = useDashboard();

  if (!selectedFeatureId || !clickLatLng || !geojsonData) return null;

  const feature = geojsonData.features.find(f => f.id === selectedFeatureId);
  if (!feature) return null;

  const { grau_de_po, count, metodologi } = feature.properties;
  const cfg = GRADE_CONFIG[grau_de_po] ?? { fillColor: '#999' };
  const fonte = parseMetodologia(metodologi);
  const lat = clickLatLng.lat.toFixed(5);
  const lng = clickLatLng.lng.toFixed(5);

  return (
    <Popup
      position={clickLatLng}
      onClose={() => setSelectedFeatureId(null)}
      maxWidth={300}
      minWidth={230}
      className="map-infowindow"
    >
      <div className="iw-body">
        <div className="iw-grade" style={{ background: cfg.fillColor }}>
          {grau_de_po}
        </div>

        <div className="iw-rows">
          <div className="iw-row">
            <span className="iw-label">Ocorrências</span>
            <strong className="iw-value">{count ?? '–'}</strong>
          </div>
          <div className="iw-row">
            <span className="iw-label">Coordenadas</span>
            <span className="iw-value iw-coords">{lat}° / {lng}°</span>
          </div>
          <div className="iw-row">
            <span className="iw-label">ID da feição</span>
            <span className="iw-value">#{selectedFeatureId}</span>
          </div>
        </div>

        {fonte && (
          <div className="iw-fonte">
            <span className="iw-fonte-label">Fonte · </span>{fonte}
          </div>
        )}
      </div>
    </Popup>
  );
}

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const LIGHT_TILE = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const DARK_TILE = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const LIGHT_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
const DARK_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

function FitBounds({ data }) {
  const map = useMap();
  useEffect(() => {
    if (!data) return;
    try {
      const bounds = L.geoJSON(data).getBounds();
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [20, 20] });
    } catch (_) {}
  }, [data, map]);
  return null;
}

function GeoJSONLayer({ data }) {
  const {
    visibleGrades, selectedGrades, selectedFeatureId,
    selectFeature,
  } = useDashboard();
  const map = useMap();

  const geoJsonRef = useRef(null);
  const mapToolActive = useRef(false); // true quando qualquer ferramenta de desenho está ativa

  // Mutable ref holds latest state so event handlers never stale-close
  const stateRef = useRef({});
  stateRef.current = { visibleGrades, selectedGrades, selectedFeatureId };

  // Ref estável para selectFeature — evita recriar onEachFeature a cada render do contexto
  const selectFeatureRef = useRef(selectFeature);
  selectFeatureRef.current = selectFeature;

  // Ouve eventos do MapTools para bloquear/liberar cliques no shapefile
  useEffect(() => {
    const on = () => { mapToolActive.current = true; };
    const off = () => { mapToolActive.current = false; };
    map.on('maptool:activate', on);
    map.on('maptool:deactivate', off);
    return () => { map.off('maptool:activate', on); map.off('maptool:deactivate', off); };
  }, [map]);

  const featureStyle = useCallback((feature, hover = false) => {
    const { visibleGrades, selectedGrades, selectedFeatureId } = stateRef.current;
    const grade = feature.properties.grau_de_po;
    const cfg = GRADE_CONFIG[grade] ?? { color: '#666', fillColor: '#999' };
    const visible = visibleGrades.has(grade);

    let highlighted = false;
    let dimmed = false;
    if (selectedFeatureId !== null) {
      highlighted = feature.id === selectedFeatureId;
      dimmed = !highlighted;
    } else if (selectedGrades.size > 0) {
      highlighted = selectedGrades.has(grade);
      dimmed = !highlighted;
    }

    return {
      color: cfg.fillColor,
      fillColor: cfg.fillColor,
      weight: 0,
      opacity: 0,
      fillOpacity: !visible ? 0 : highlighted ? 0.93 : dimmed ? 0.05 : hover ? 0.82 : 0.65,
    };
  }, []);

  const featureStyleRef = useRef(featureStyle);
  featureStyleRef.current = featureStyle;

  // Imperative style update on selection / visibility change
  useEffect(() => {
    if (!geoJsonRef.current) return;
    geoJsonRef.current.eachLayer(layer => {
      layer.setStyle(featureStyleRef.current(layer.feature));
    });
  }, [visibleGrades, selectedGrades, selectedFeatureId]);

  const onEachFeature = useCallback((feature, layer) => {
    layer.on({
      click: (e) => {
        // Ignora cliques quando ferramenta de desenho/apagar está ativa
        if (mapToolActive.current) return;
        const { visibleGrades, selectedFeatureId } = stateRef.current;
        if (!visibleGrades.has(feature.properties.grau_de_po)) return;
        const toggling = selectedFeatureId === feature.id;
        selectFeatureRef.current(toggling ? null : feature.id, toggling ? null : e.latlng);
      },
      mouseover: e => {
        if (!stateRef.current.visibleGrades.has(feature.properties.grau_de_po)) return;
        e.target.setStyle(featureStyleRef.current(feature, true));
        e.target.bringToFront();
      },
      mouseout: e => {
        e.target.setStyle(featureStyleRef.current(feature));
      },
    });
    const grade = feature.properties.grau_de_po;
    const count = feature.properties.count ?? '–';
    layer.bindTooltip(
      `<div class="map-tooltip"><strong>${grade}</strong><br>Ocorrências: <b>${count}</b></div>`,
      { sticky: true, opacity: 0.92 }
    );
  }, []); // deps vazios — todo o estado é acessado via refs, sem recriar a layer

  const initialStyle = useCallback((feature) => {
    const grade = feature.properties.grau_de_po;
    const cfg = GRADE_CONFIG[grade] ?? { color: '#666', fillColor: '#999' };
    return { color: cfg.fillColor, fillColor: cfg.fillColor, weight: 0, opacity: 0, fillOpacity: 0.65 };
  }, []);

  return (
    <GeoJSON
      ref={geoJsonRef}
      data={data}
      style={initialStyle}
      onEachFeature={onEachFeature}
    />
  );
}

export default function MapView() {
  const { geojsonData, loading, error, theme } = useDashboard();

  if (loading) return <div className="map-placeholder">Carregando dados geoespaciais…</div>;
  if (error) return <div className="map-placeholder map-error">{error}</div>;

  return (
    <MapContainer center={[-18.5, -44.5]} zoom={6} className="map-container" zoomControl={true}>
      <TileLayer
        key={`tile-${theme}`}
        url={theme === 'dark' ? DARK_TILE : LIGHT_TILE}
        attribution={theme === 'dark' ? DARK_ATTR : LIGHT_ATTR}
      />
      {geojsonData && (
        <>
          <FitBounds data={geojsonData} />
          <GeoJSONLayer data={geojsonData} />
          <MapInfoWindow />
          <MapTools />
        </>
      )}
    </MapContainer>
  );
}
