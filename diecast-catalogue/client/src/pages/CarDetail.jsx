import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useSettings } from '../settings.js';
import { CarSilhouette } from '../components/CarCard.jsx';
import { bookingLink, formatPrice, STATUS_LABEL } from '../utils.js';

export default function CarDetail() {
  const { id } = useParams();
  const settings = useSettings();
  const [car, setCar] = useState(null);
  const [error, setError] = useState('');
  const [active, setActive] = useState(0);

  useEffect(() => {
    setCar(null);
    setError('');
    setActive(0);
    api
      .car(id)
      .then((c) => {
        setCar(c);
        document.title = `${c.name} | ${settings.shopName}`;
      })
      .catch((e) => setError(e.status === 404 ? 'This car is not in the collection any more.' : e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (error)
    return (
      <p className="notice error" role="alert">
        {error} <Link to="/">Back to the collection</Link>
      </p>
    );
  if (!car) return <p className="notice">Loading…</p>;

  const images = car.images || [];
  const sold = car.status === 'sold';
  const canBook = !sold && settings.whatsappNumber;

  const Book = ({ className = '' }) =>
    canBook ? (
      <a className={`btn btn-whatsapp ${className}`} href={bookingLink(settings.whatsappNumber, car)} target="_blank" rel="noreferrer">
        {car.status === 'reserved' ? 'Ask about this car on WhatsApp' : 'Book on WhatsApp'}
      </a>
    ) : (
      <span className={`btn btn-disabled ${className}`} aria-disabled="true">
        {sold ? 'Sold' : 'Booking unavailable'}
      </span>
    );

  return (
    <article className="detail" style={{ '--paint': car.color }}>
      <Link to="/" className="back">
        Back to the collection
      </Link>

      <div className="detail-grid">
        <div className="gallery">
          <div className="plinth plinth-large">
            {images.length ? <img src={images[active]?.url} alt={`${car.name}, photo ${active + 1}`} /> : <CarSilhouette color={car.color} />}
            {car.status !== 'available' && <span className={`flag flag-${car.status}`}>{STATUS_LABEL[car.status]}</span>}
          </div>
          {images.length > 1 && (
            <div className="thumbs">
              {images.map((img, i) => (
                <button type="button" key={img.url} className={i === active ? 'on' : ''} onClick={() => setActive(i)} aria-label={`Show photo ${i + 1}`} aria-current={i === active}>
                  <img src={img.url} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="detail-info">
          <p className="detail-brand">{car.brand}</p>
          <h1>{car.name}</h1>
          <p className="detail-price">{formatPrice(car.price)}</p>

          <dl className="specs">
            <div>
              <dt>Scale</dt>
              <dd className="spec-scale">{car.scale}</dd>
            </div>
            <div>
              <dt>Condition</dt>
              <dd>{car.condition}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{STATUS_LABEL[car.status]}</dd>
            </div>
          </dl>

          {car.description && <p className="detail-desc">{car.description}</p>}

          <div className="book-inline">
            <Book />
            {canBook && <p className="hint">This opens WhatsApp with the car's name and price already typed in.</p>}
          </div>
        </div>
      </div>

      <div className="buybar">
        <span className="buybar-price">{formatPrice(car.price)}</span>
        <Book className="buybar-btn" />
      </div>
    </article>
  );
}
