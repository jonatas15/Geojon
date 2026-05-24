import { DashboardProvider } from './context/DashboardContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MapView from './components/MapView';

export default function App() {
  return (
    <DashboardProvider>
      <div className="app-shell">
        <Header />
        <div className="app-body">
          <Sidebar />
          <main className="map-wrapper">
            <MapView />
          </main>
        </div>
      </div>
    </DashboardProvider>
  );
}
