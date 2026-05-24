import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { GRADE_CONFIG, GRADE_ORDER } from '../config/grades';

const DashboardContext = createContext(null);

export function DashboardProvider({ children }) {
  const [geojsonData, setGeojsonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState('light');
  const [visibleGrades, setVisibleGrades] = useState(new Set(Object.keys(GRADE_CONFIG)));
  const [selectedGrade, setSelectedGradeRaw] = useState(null);
  const [selectedFeatureId, setSelectedFeatureIdRaw] = useState(null);
  const [clickLatLng, setClickLatLng] = useState(null);

  useEffect(() => {
    fetch('/data/cavidades.geojson')
      .then(r => { if (!r.ok) throw new Error('GeoJSON não encontrado. Execute: npm run preprocess'); return r.json(); })
      .then(data => { setGeojsonData(data); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const stats = useMemo(() => {
    if (!geojsonData) return {};
    const counts = {};
    for (const f of geojsonData.features) {
      const g = f.properties.grau_de_po;
      counts[g] = (counts[g] || 0) + 1;
    }
    return counts;
  }, [geojsonData]);

  const selectedFeatureGrade = useMemo(() => {
    if (selectedFeatureId === null || !geojsonData) return null;
    const f = geojsonData.features.find(f => f.id === selectedFeatureId);
    return f?.properties?.grau_de_po ?? null;
  }, [selectedFeatureId, geojsonData]);

  const activeGrade = selectedGrade ?? selectedFeatureGrade;

  const totalVisible = useMemo(() => {
    if (!geojsonData) return 0;
    return geojsonData.features.filter(f => visibleGrades.has(f.properties.grau_de_po)).length;
  }, [geojsonData, visibleGrades]);

  const setSelectedGrade = (gradeOrFn) => {
    setSelectedGradeRaw(gradeOrFn);
    setSelectedFeatureIdRaw(null);
    setClickLatLng(null);
  };

  // Chamado pela sidebar (sem latlng) — fecha o popup
  const setSelectedFeatureId = (id) => {
    setSelectedFeatureIdRaw(id);
    setSelectedGradeRaw(null);
    if (id === null) setClickLatLng(null);
  };

  // Chamado pelo clique no mapa — registra posição para o popup
  const selectFeature = (id, latlng) => {
    setSelectedFeatureIdRaw(id);
    setSelectedGradeRaw(null);
    setClickLatLng(id !== null ? latlng : null);
  };

  const toggleGrade = (grade) => {
    setVisibleGrades(prev => {
      const next = new Set(prev);
      next.has(grade) ? next.delete(grade) : next.add(grade);
      return next;
    });
  };

  const toggleAll = (show) => {
    setVisibleGrades(show ? new Set(GRADE_ORDER) : new Set());
  };

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  return (
    <DashboardContext.Provider value={{
      geojsonData, loading, error,
      theme, toggleTheme,
      visibleGrades, toggleGrade, toggleAll,
      selectedGrade, setSelectedGrade,
      selectedFeatureId, setSelectedFeatureId, selectFeature,
      clickLatLng,
      selectedFeatureGrade, activeGrade,
      stats, totalVisible,
    }}>
      {children}
    </DashboardContext.Provider>
  );
}

export const useDashboard = () => useContext(DashboardContext);
