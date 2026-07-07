import { IMAGES } from '../config/images';
import './DestinationStrip.css';

export function DestinationStrip() {
  return (
    <section className="destination-strip" aria-label="Popular European weekend destinations">
      <div className="container">
        <div className="destination-strip-header">
          <p className="destination-eyebrow">Inspiration</p>
          <h2>Weekend cities waiting for you</h2>
        </div>
        <div className="destination-grid">
          {IMAGES.destinations.map(destination => (
            <figure key={destination.code} className="destination-card">
              <img src={destination.image} alt={`${destination.name} cityscape`} loading="lazy" />
              <figcaption>
                <span className="destination-name">{destination.name}</span>
                <span className="destination-code">{destination.code}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
