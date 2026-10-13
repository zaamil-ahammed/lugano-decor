import { Link } from 'react-router-dom';
import { formatPrice, STATUS_LABEL } from '../utils.js';

/** Plain side-on coupe, drawn in the car's own paint colour, for cars that have no photo yet. */
export function CarSilhouette({ color = '#c9ced1' }) {
  return (
    <svg className="silhouette" viewBox="0 0 200 100" role="img" aria-label="No photo yet">
      <path
        d="M16 66c0-8 4-12 12-14l30-6 24-22c3-3 7-5 12-5h38c5 0 9 2 12 5l22 20 22 4c8 2 12 6 12 14v6c0 3-2 5-5 5h-9a20 20 0 0 0-40 0H78a20 20 0 0 0-40 0h-17c-3 0-5-2-5-5z"
        fill={color}
      />
      <path d="M82 28h30v18H70zM120 28h12l18 18h-30z" fill="#fff" opacity="0.55" />
      <circle cx="58" cy="76" r="14" fill="#1e2328" />
      <circle cx="58" cy="76" r="6" fill="#dfe2e0" />
      <circle cx="158" cy="76" r="14" fill="#1e2328" />
      <circle cx="158" cy="76" r="6" fill="#dfe2e0" />
    </svg>
  );
}

export default function CarCard({ car }) {
  const cover = car.images?.[0]?.url;
  const sold = car.status === 'sold';
  return (
    <Link to={`/car/${car._id}`} className={`card${sold ? ' is-sold' : ''}`} style={{ '--paint': car.color }}>
      <div className="plinth">
        {cover ? <img src={cover} alt={car.name} loading="lazy" /> : <CarSilhouette color={car.color} />}
        {car.status !== 'available' && <span className={`flag flag-${car.status}`}>{STATUS_LABEL[car.status]}</span>}
      </div>
      <div className="card-body">
        <div className="card-top">
          <span className="card-brand">{car.brand}</span>
          <span className="card-scale">{car.scale}</span>
        </div>
        <h3 className="card-name">{car.name}</h3>
        <div className="card-bottom">
          <span className="card-price">{formatPrice(car.price)}</span>
          <span className="card-cond">{car.condition}</span>
        </div>
      </div>
    </Link>
  );
}
