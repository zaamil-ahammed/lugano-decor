import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, setToken } from '../api.js';
import ImageEditor from '../components/Imageeditor.jsx';
import { CONDITIONS, SCALES, STATUS_LABEL } from '../utils.js';

const EMPTY = {
  name: '',
  brand: '',
  scale: '1:64',
  condition: 'Boxed',
  price: '',
  description: '',
  color: '#2f6fb5',
  status: 'available',
  images: [],
};

export default function CarForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const fileInput = useRef(null);
  const [car, setCar] = useState(EMPTY);
  const [loading, setLoading] = useState(editing);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState(null); // the photo open in the editor

  function fail(err) {
    if (err.status === 401) {
      setToken('');
      navigate('/admin/login', { replace: true });
    } else {
      setError(err.message);
    }
  }

  useEffect(() => {
    if (!editing) return;
    api
      .car(id)
      .then((c) => setCar({ ...EMPTY, ...c, price: String(c.price) }))
      .catch(fail)
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const set = (key) => (e) => setCar({ ...car, [key]: e.target.value });

  async function addPhotos(e) {
    const files = [...e.target.files];
    e.target.value = '';
    if (!files.length) return;
    if (car.images.length + files.length > 8) {
      setError('A car can have up to 8 photos.');
      return;
    }
    setUploading(true);
    setError('');
    try {
      const saved = await api.upload(files);
      setCar((c) => ({ ...c, images: [...c.images, ...saved] }));
    } catch (err) {
      fail(err);
    } finally {
      setUploading(false);
    }
  }

  // The editor gives back a new JPEG. Upload it and swap it in for the photo that was edited.
  // A saved car drops the old file from storage when the car is saved.
  async function saveEditedPhoto(blob) {
    const original = editingPhoto;
    const file = new File([blob], 'edited.jpg', { type: 'image/jpeg' });
    try {
      const [saved] = await api.upload([file]);
      setCar((c) => ({ ...c, images: c.images.map((i) => (i.url === original.url ? saved : i)) }));
      setEditingPhoto(null);
    } catch (err) {
      if (err.status === 401) {
        setToken('');
        navigate('/admin/login', { replace: true });
      }
      throw err; // the editor shows the message and stays open
    }
  }

  const removePhoto = (url) => setCar({ ...car, images: car.images.filter((i) => i.url !== url) });
  const makeCover = (url) => {
    const picked = car.images.find((i) => i.url === url);
    setCar({ ...car, images: [picked, ...car.images.filter((i) => i.url !== url)] });
  };

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const body = {
      name: car.name,
      brand: car.brand,
      scale: car.scale,
      condition: car.condition,
      price: Number(car.price),
      description: car.description,
      color: car.color,
      status: car.status,
      images: car.images,
    };
    try {
      if (editing) await api.updateCar(id, body);
      else await api.createCar(body);
      navigate('/admin');
    } catch (err) {
      fail(err);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="notice">Loading…</p>;

  return (
    <section className="panel">
      <Link to="/admin" className="back">
        Back to all cars
      </Link>
      <h1>{editing ? 'Edit car' : 'Add a car'}</h1>

      <form className="form" onSubmit={save}>
        <label>
          Name
          <input value={car.name} onChange={set('name')} placeholder="Nissan Skyline GT-R (R34)" maxLength={120} required />
        </label>

        <div className="form-row">
          <label>
            Brand
            <input value={car.brand} onChange={set('brand')} placeholder="Hot Wheels, Mini GT, Maisto" maxLength={60} required />
          </label>
          <label>
            Scale
            <input value={car.scale} onChange={set('scale')} list="scales" maxLength={12} required />
          </label>
        </div>
        <datalist id="scales">
          {SCALES.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>

        <div className="form-row">
          <label>
            Condition
            <select value={car.condition} onChange={set('condition')}>
              {CONDITIONS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            Price in rupees
            <input type="number" min="0" step="1" inputMode="numeric" value={car.price} onChange={set('price')} required />
          </label>
        </div>

        <div className="form-row">
          <label>
            Status
            <select value={car.status} onChange={set('status')}>
              {Object.entries(STATUS_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Paint colour
            <input type="color" value={car.color} onChange={set('color')} />
            <small>The catalogue uses this colour for the stripe under the car.</small>
          </label>
        </div>

        <label>
          Description
          <textarea rows={4} value={car.description} onChange={set('description')} maxLength={2000} placeholder="Any wear on the box, opened or sealed, rare variant, anything a buyer should know." />
        </label>

        <fieldset className="photos">
          <legend>Photos (up to 8, the first one is the cover)</legend>
          <ul className="photo-list">
            {car.images.map((img, i) => (
              <li key={img.url}>
                <img src={img.url} alt={`Photo ${i + 1}`} />
                <div className="photo-actions">
                  {i === 0 ? (
                    <span className="cover-tag">Cover</span>
                  ) : (
                    <button type="button" onClick={() => makeCover(img.url)}>
                      Make cover
                    </button>
                  )}
                  <button type="button" onClick={() => setEditingPhoto(img)}>
                    Edit
                  </button>
                  <button type="button" onClick={() => removePhoto(img.url)}>
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={addPhotos} hidden />
          <button type="button" className="btn btn-quiet" onClick={() => fileInput.current.click()} disabled={uploading || car.images.length >= 8}>
            {uploading ? 'Uploading…' : 'Add photos'}
          </button>
        </fieldset>

        {error && (
          <p className="notice error" role="alert">
            {error}
          </p>
        )}

        <div className="row">
          <button className="btn btn-primary" disabled={saving || uploading}>
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Add car'}
          </button>
          <Link to="/admin" className="btn btn-quiet">
            Cancel
          </Link>
        </div>
      </form>

      {editingPhoto && <ImageEditor key={editingPhoto.url} src={editingPhoto.url} onSave={saveEditedPhoto} onCancel={() => setEditingPhoto(null)} />}
    </section>
  );
}