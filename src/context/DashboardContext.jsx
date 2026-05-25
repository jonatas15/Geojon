import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { GRADE_CONFIG, GRADE_ORDER } from '../config/grades';

const DashboardContext = createContext(null);

export function DashboardProvider({ children }) {
  const [geojsonData, setGeojsonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState('light');
  const [visibleGrades, setVisibleGrades] = useState(new Set(Object.keys(GRADE_CONFIG)));
  const [selectedGrades, setSelectedGradesRaw] = useState(new Set());
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

  // Grades efetivamente em destaque: feature selecionada tem prioridade
  const activeGrades = useMemo(() => {
    if (selectedFeatureId !== null && selectedFeatureGrade) {
      return new Set([selectedFeatureGrade]);
    }
    return selectedGrades;
  }, [selectedFeatureId, selectedFeatureGrade, selectedGrades]);

  const totalVisible = useMemo(() => {
    if (!geojsonData) return 0;
    return geojsonData.features.filter(f => visibleGrades.has(f.properties.grau_de_po)).length;
  }, [geojsonData, visibleGrades]);

  // Alterna inclusão/exclusão do grau na seleção múltipla
  const setSelectedGrade = (grade) => {
    if (grade === null) {
      setSelectedGradesRaw(new Set());
    } else {
      setSelectedGradesRaw(prev => {
        const next = new Set(prev);
        next.has(grade) ? next.delete(grade) : next.add(grade);
        return next;
      });
    }
    setSelectedFeatureIdRaw(null);
    setClickLatLng(null);
  };

  const setSelectedFeatureId = (id) => {
    setSelectedFeatureIdRaw(id);
    setSelectedGradesRaw(new Set());
    if (id === null) setClickLatLng(null);
  };

  const selectFeature = (id, latlng) => {
    setSelectedFeatureIdRaw(id);
    setSelectedGradesRaw(new Set());
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
      selectedGrades, setSelectedGrade,
      selectedFeatureId, setSelectedFeatureId, selectFeature,
      clickLatLng,
      selectedFeatureGrade, activeGrades,
      stats, totalVisible,
    }}>
      {children}
    </DashboardContext.Provider>
  );
}

export const useDashboard = () => useContext(DashboardContext);
