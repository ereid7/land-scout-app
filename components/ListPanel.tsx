'use client';

import { formatCurrency } from '@/lib/listing-helpers';
import type { ListingWithLocation } from '@/lib/types';

function scoreClass(score: number) {
  if (score >= 90) {
    return 'list-card__score list-card__score--green';
  }
  if (score >= 75) {
    return 'list-card__score list-card__score--yellow';
  }
  if (score >= 60) {
    return 'list-card__score list-card__score--orange';
  }
  return 'list-card__score list-card__score--red';
}

export default function ListPanel({
  listings,
  selectedId,
  open,
  onSelect,
  onClose,
}: {
  listings: ListingWithLocation[];
  selectedId: string | null;
  open: boolean;
  onSelect: (listingId: string) => void;
  onClose: () => void;
}) {
  const sortedListings = [...listings].sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }
    return (left.price ?? Number.MAX_SAFE_INTEGER) - (right.price ?? Number.MAX_SAFE_INTEGER);
  });

  return (
    <aside className={`list-panel${open ? ' list-panel--open' : ''}`}>
      <div className="list-panel__header">
        <div>
          <div className="list-panel__title">Listings</div>
          <div className="list-panel__subtitle">{listings.length} matching parcels</div>
        </div>
        <button className="icon-button" type="button" onClick={onClose} aria-label="Close listing panel">
          ×
        </button>
      </div>
      <div className="list-panel__body">
        {sortedListings.length === 0 ? (
          <div className="empty-state">No listings match the current filters.</div>
        ) : (
          sortedListings.slice(0, 150).map((listing) => (
            <button
              key={listing.id}
              type="button"
              className={`list-card${listing.id === selectedId ? ' list-card--active' : ''}`}
              onClick={() => onSelect(listing.id)}
            >
              <div className="list-card__top">
                <div className="list-card__price">
                  {formatCurrency(listing.price)} · {listing.acres ?? 'N/A'} ac
                </div>
                <div className={scoreClass(listing.score)}>{listing.score}</div>
              </div>
              <div className="list-card__meta">
                {[listing.state, listing.county].filter(Boolean).join(' · ')}
              </div>
              <div className="list-card__meta">
                {listing.source || 'Unknown source'}
                {(listing.days_on_market ?? 0) > 0 ? ` · ${listing.days_on_market}d listed` : ''}
              </div>
              <div className="list-card__badges">
                {listing.owner_financing ? <span className="pill">Owner Finance</span> : null}
                {listing.has_water ? <span className="pill">Water</span> : null}
                {listing.has_trees ? <span className="pill">Trees</span> : null}
                {listing.motivated_seller ? <span className="pill">Motivated</span> : null}
              </div>
            </button>
          ))
        )}
      </div>
    </aside>
  );
}
