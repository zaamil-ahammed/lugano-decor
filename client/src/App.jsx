import { useEffect, useState } from 'react';
import { Link, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { api, getToken } from './api.js';
import { SettingsContext, useSettings } from './settings.js';
import { generalLink } from './utils.js';
import Home from './pages/Home.jsx';
import CarDetail from './pages/CarDetail.jsx';
import AdminLogin from './pages/AdminLogin.jsx';
import Admin from './pages/Admin.jsx';
import CarForm from './pages/CarForm.jsx';

function Layout() {
  const settings = useSettings();
  return (
    <>
      <header className="site-header">
        <Link to="/" className="wordmark">
  <img src="/logo.svg" alt="" className="logo" 
  alt={settings.shopName}/>
</Link>
        {settings.whatsappNumber && (
          <a className="header-link" href={generalLink(settings.whatsappNumber)} target="_blank" rel="noreferrer">
            Order on WhatsApp
          </a>
        )}
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="site-footer">
        { <span>The best you can everget.</span> }
      </footer>
    </>
  );
}

function RequireAdmin({ children }) {
  const location = useLocation();
  if (!getToken()) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  return children;
}

export default function App() {
  const [settings, setSettings] = useState({ shopName: 'Lugano Diecast', tagline: '', whatsappNumber: '' });

  useEffect(() => {
    api
      .settings()
      .then((s) => {
        setSettings(s);
        document.title = s.shopName;
      })
      .catch(() => {
        /* The catalogue pages show their own error if the server is down. */
      });
  }, []);

  return (
    <SettingsContext.Provider value={{ ...settings, setSettings }}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/car/:id" element={<CarDetail />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <Admin />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/cars/new"
            element={
              <RequireAdmin>
                <CarForm />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/cars/:id"
            element={
              <RequireAdmin>
                <CarForm />
              </RequireAdmin>
            }
          />
          <Route path="*" element={<p className="notice">That page does not exist. <Link to="/">Back to the collection</Link></p>} />
        </Route>
      </Routes>
    </SettingsContext.Provider>
  );
}
