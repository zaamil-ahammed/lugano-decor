import { useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';
import { useSettings } from '../settings.js';
import CarCard from '../components/CarCard.jsx';
import { CONDITIONS } from '../utils.js';

export default function Home() {
  const settings = useSettings();
  const [cars, setCars] = useState(null);
  const [error, setError] = useState('');
  const [scale, setScale] = useState('');
  const [brand, setBrand] = useState('');
  const [condition, setCondition] = useState('');
  const [hideSold, setHideSold] = useState(false);
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('new');

  useEffect(() => {
    api
      .cars()
      .then(setCars)
      .catch((e) => setError(e.message));
  }, []);

  const scales = useMemo(() => {
    const counts = {};
    (cars || []).forEach((c) => {
      counts[c.scale] = (counts[c.scale] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [cars]);

  const brands = useMemo(() => [...new Set((cars || []).map((c) => c.brand))].sort(), [cars]);

  const shown = useMemo(() => {
    let list = (cars || []).filter((c) => {
      if (scale && c.scale !== scale) return false;
      if (brand && c.brand !== brand) return false;
      if (condition && c.condition !== condition) return false;
      if (hideSold && c.status === 'sold') return false;
      if (q) {
        const needle = q.trim().toLowerCase();
        if (!`${c.name} ${c.brand}`.toLowerCase().includes(needle)) return false;
      }
      return true;
    });
    if (sort === 'low') list = [...list].sort((a, b) => a.price - b.price);
    if (sort === 'high') list = [...list].sort((a, b) => b.price - a.price);
    // Available cars first, sold ones last, so buyers see what they can book.
    const rank = { available: 0, reserved: 1, sold: 2 };
    return [...list].sort((a, b) => rank[a.status] - rank[b.status]);
  }, [cars, scale, brand, condition, hideSold, q, sort]);

  const filtering = scale || brand || condition || hideSold || q;
  const clear = () => {
    setScale('');
    setBrand('');
    setCondition('');
    setHideSold(false);
    setQ('');
  };

  const forSale = (cars || []).filter((c) => c.status !== 'sold').length;

  return (
    <>
      <section className="hero">
        <h1>{settings.shopName}</h1>
        {settings.tagline && <p className="tagline">{settings.tagline}</p>}
        {cars && (
          <p className="hero-count">
            {forSale} {forSale === 1 ? 'car' : 'cars'} available now
          </p>
        )}

        {scales.length > 0 && (
          <div className="ruler" role="group" aria-label="Filter by scale">
            <button type="button" className={`ruler-stop${scale === '' ? ' on' : ''}`} onClick={() => setScale('')} aria-pressed={scale === ''}>
              <span className="ruler-size">All</span>
              <span className="ruler-count">{cars.length}</span>
            </button>
            {scales.map(([s, n]) => (
              <button type="button" key={s} className={`ruler-stop${scale === s ? ' on' : ''}`} onClick={() => setScale(scale === s ? '' : s)} aria-pressed={scale === s}>
                <span className="ruler-size">{s}</span>
                <span className="ruler-count">{n}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="shelf">
        <div className="filters">
          <label className="field grow">
            <span className="sr-only">Search cars</span>
            <input type="search" placeholder="Search by name or brand" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
          <label className="field">
            <span className="sr-only">Brand</span>
            <select value={brand} onChange={(e) => setBrand(e.target.value)}>
              <option value="">All brands</option>
              {brands.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="sr-only">Condition</span>
            <select value={condition} onChange={(e) => setCondition(e.target.value)}>
              <option value="">Any condition</option>
              {CONDITIONS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="sr-only">Sort</span>
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="new">Newest first</option>
              <option value="low">Price, low to high</option>
              <option value="high">Price, high to low</option>
            </select>
          </label>
          <label className="check">
            <input type="checkbox" checked={hideSold} onChange={(e) => setHideSold(e.target.checked)} />
            Hide sold
          </label>
        </div>

        {error && (
          <p className="notice error" role="alert">
            {error}
          </p>
        )}
        {!cars && !error && <p className="notice">Loading the collection…</p>}

        {cars && shown.length === 0 && (
          <div className="notice">
            {cars.length === 0 ? (
              <p>No cars are listed yet. Check back soon.</p>
            ) : (
              <p>
                No cars match these filters.{' '}
                {filtering && (
                  <button type="button" className="link" onClick={clear}>
                    Clear filters
                  </button>
                )}
              </p>
            )}
          </div>
        )}

        <div className="grid">
          {shown.map((car) => (
            <CarCard key={car._id} car={car} />
          ))}
        </div>
      </section>
    </>
  );
}
