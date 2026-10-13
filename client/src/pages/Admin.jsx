import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, setToken } from '../api.js';
import { useSettings } from '../settings.js';
import { CarSilhouette } from '../components/CarCard.jsx';
import { formatPrice, STATUS_LABEL } from '../utils.js';

export default function Admin() {
  const navigate = useNavigate();
  const settings = useSettings();
  const [cars, setCars] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [form, setForm] = useState({ shopName: '', tagline: '', whatsappNumber: '' });
  const [savingSettings, setSavingSettings] = useState(false);

  const handle = useCallback(
    (err) => {
      if (err.status === 401) {
        setToken('');
        navigate('/admin/login', { replace: true });
      } else {
        setMessage({ type: 'error', text: err.message });
      }
    },
    [navigate]
  );

  useEffect(() => {
    api.checkLogin().catch(handle);
    api.cars().then(setCars).catch(handle);
  }, [handle]);

  useEffect(() => {
    setForm({ shopName: settings.shopName, tagline: settings.tagline, whatsappNumber: settings.whatsappNumber });
  }, [settings.shopName, settings.tagline, settings.whatsappNumber]);

  async function changeStatus(car, status) {
    try {
      const updated = await api.updateCar(car._id, { status });
      setCars((list) => list.map((c) => (c._id === car._id ? updated : c)));
      setMessage({ type: 'ok', text: `${car.name} marked ${STATUS_LABEL[status].toLowerCase()}.` });
    } catch (err) {
      handle(err);
    }
  }

  async function remove(car) {
    if (!window.confirm(`Delete "${car.name}"? This cannot be undone.`)) return;
    try {
      await api.deleteCar(car._id);
      setCars((list) => list.filter((c) => c._id !== car._id));
      setMessage({ type: 'ok', text: `${car.name} deleted.` });
    } catch (err) {
      handle(err);
    }
  }

  async function saveSettings(e) {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const saved = await api.updateSettings(form);
      settings.setSettings(saved);
      setMessage({ type: 'ok', text: 'Shop details saved.' });
    } catch (err) {
      handle(err);
    } finally {
      setSavingSettings(false);
    }
  }

  function logout() {
    setToken('');
    navigate('/admin/login', { replace: true });
  }

  return (
    <section className="panel">
      <div className="panel-head">
        <h1>Manage cars</h1>
        <div className="row">
          <Link to="/admin/cars/new" className="btn btn-primary">
            Add a car
          </Link>
          <button type="button" className="btn btn-quiet" onClick={logout}>
            Log out
          </button>
        </div>
      </div>

      {message.text && (
        <p className={`notice ${message.type === 'error' ? 'error' : 'ok'}`} role={message.type === 'error' ? 'alert' : 'status'}>
          {message.text}
        </p>
      )}

      {!cars && <p className="notice">Loading…</p>}
      {cars && cars.length === 0 && (
        <p className="notice">
          No cars yet. <Link to="/admin/cars/new">Add your first car</Link>.
        </p>
      )}

      {cars && cars.length > 0 && (
        <ul className="admin-list">
          {cars.map((car) => (
            <li key={car._id} className="admin-row">
              <div className="admin-thumb" style={{ '--paint': car.color }}>
                {car.images?.[0] ? <img src={car.images[0].url} alt="" loading="lazy" /> : <CarSilhouette color={car.color} />}
              </div>
              <div className="admin-main">
                <strong>{car.name}</strong>
                <span>
                  {car.brand}, {car.scale}, {car.condition}
                </span>
                <span className="admin-price">{formatPrice(car.price)}</span>
              </div>
              <label className="admin-status">
                <span className="sr-only">Status of {car.name}</span>
                <select value={car.status} onChange={(e) => changeStatus(car, e.target.value)}>
                  {Object.entries(STATUS_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="row">
                <Link to={`/admin/cars/${car._id}`} className="btn btn-quiet">
                  Edit
                </Link>
                <button type="button" className="btn btn-danger" onClick={() => remove(car)}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <h2>Shop details</h2>
      <form className="form" onSubmit={saveSettings}>
        <label>
          Shop name
          <input value={form.shopName} onChange={(e) => setForm({ ...form, shopName: e.target.value })} maxLength={60} required />
        </label>
        <label>
          Line under the name
          <input value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} maxLength={140} />
        </label>
        <label>
          WhatsApp number for bookings
          <input
            value={form.whatsappNumber}
            onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })}
            inputMode="numeric"
            placeholder="919447650667"
            required
          />
          <small>Include the country code, for India start with 91.</small>
        </label>
        <button className="btn btn-primary" disabled={savingSettings}>
          {savingSettings ? 'Saving…' : 'Save shop details'}
        </button>
      </form>
    </section>
  );
}
