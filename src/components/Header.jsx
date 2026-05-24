import { useDashboard } from '../context/DashboardContext';

export default function Header() {
  const { theme, toggleTheme, loading } = useDashboard();

  return (
    <header className="header">
      <div className="header-brand">
        <span className="header-icon">🗺️</span>
        <div>
          <h1 className="header-title">Potencialidade de Cavidades</h1>
          <p className="header-sub">Minas Gerais · IDE 2002 · SIRGAS 2000 · 1:2.500.000</p>
        </div>
      </div>

      <div className="header-actions">
        {loading && <span className="header-loading">Carregando…</span>}
        <button
          className="theme-btn"
          onClick={toggleTheme}
          title={`Mudar para tema ${theme === 'light' ? 'escuro' : 'claro'}`}
        >
          {theme === 'light' ? '🌙 Escuro' : '☀️ Claro'}
        </button>
      </div>
    </header>
  );
}
