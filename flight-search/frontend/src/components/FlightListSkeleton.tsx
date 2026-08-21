import './FlightCard.css';
import './FlightListSkeleton.css';

interface FlightListSkeletonProps {
  rows?: number;
  label?: string;
}

function SkeletonBone({ className }: { className: string }) {
  return <span className={`flight-skeleton-bone ${className}`} />;
}

function FlightSkeletonCard() {
  return (
    <article className="block-result flight-skeleton-card">
      <div className="result-destination-banner">
        <span className="result-route-end">
          <SkeletonBone className="flight-skeleton-label" />
          <span className="result-route-place">
            <SkeletonBone className="flight-skeleton-flag" />
            <SkeletonBone className="flight-skeleton-city" />
            <SkeletonBone className="flight-skeleton-code" />
          </span>
        </span>
        <span className="result-route-arrow flight-skeleton-arrow" aria-hidden="true">
          →
        </span>
        <span className="result-route-end result-route-end-to">
          <SkeletonBone className="flight-skeleton-label" />
          <span className="result-route-place">
            <SkeletonBone className="flight-skeleton-flag" />
            <SkeletonBone className="flight-skeleton-city flight-skeleton-city-to" />
            <SkeletonBone className="flight-skeleton-code" />
          </span>
        </span>
      </div>

      <div className="result-grid">
        <div className="result-price">
          <SkeletonBone className="flight-skeleton-price" />
          <SkeletonBone className="flight-skeleton-sub" />
        </div>

        <div className="result-legs">
          <FlightSkeletonLeg />
          <FlightSkeletonLeg />
        </div>

        <div className="result-action">
          <SkeletonBone className="flight-skeleton-btn" />
          <SkeletonBone className="flight-skeleton-btn" />
        </div>
      </div>
    </article>
  );
}

function FlightSkeletonLeg() {
  return (
    <div className="result-leg-row">
      <SkeletonBone className="flight-skeleton-direction" />
      <div className="result-leg-date">
        <SkeletonBone className="flight-skeleton-date" />
      </div>
      <div className="result-endpoint">
        <SkeletonBone className="flight-skeleton-time" />
        <span className="result-endpoint-place">
          <SkeletonBone className="flight-skeleton-flag" />
          <SkeletonBone className="flight-skeleton-city-sm" />
          <SkeletonBone className="flight-skeleton-code" />
        </span>
      </div>
      <SkeletonBone className="flight-skeleton-meta" />
      <div className="result-endpoint">
        <SkeletonBone className="flight-skeleton-time" />
        <span className="result-endpoint-place">
          <SkeletonBone className="flight-skeleton-flag" />
          <SkeletonBone className="flight-skeleton-city-sm" />
          <SkeletonBone className="flight-skeleton-code" />
        </span>
      </div>
    </div>
  );
}

export function FlightListSkeleton({ rows = 5, label }: FlightListSkeletonProps) {
  return (
    <div className="results-panel flight-list-skeleton" role="status" aria-live="polite" aria-busy="true" aria-label={label}>
      <div className="flight-skeleton-search" aria-hidden="true">
        <SkeletonBone className="flight-skeleton-search-bar" />
      </div>
      <div className="results-toolbar" aria-hidden="true">
        <SkeletonBone className="flight-skeleton-count" />
      </div>
      <div className="flight-list results-list" aria-hidden="true">
        {Array.from({ length: rows }, (_, index) => (
          <FlightSkeletonCard key={index} />
        ))}
      </div>
    </div>
  );
}
