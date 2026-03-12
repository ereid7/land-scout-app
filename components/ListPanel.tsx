'use client';

import { useBrief } from '@/hooks/useBrief';
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
  const selectedListing = sortedListings.find((listing) => listing.id === selectedId) ?? null;
  const { brief, loading: briefLoading } = useBrief(selectedListing?.id ?? null);

  return (
    <aside className={`list-panel app-listpanel${open ? ' list-panel--open' : ''}`}>
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
      <div className="list-panel__footer">
        <div className="list-panel__preview">
          <div className="list-panel__preview-eyebrow">Brief Preview</div>
          {!selectedListing ? (
            <div className="list-panel__preview-empty">Select a parcel to preview its property brief.</div>
          ) : briefLoading ? (
            <div className="list-panel__preview-empty">Loading brief...</div>
          ) : !brief ? (
            <div className="list-panel__preview-empty">Brief unavailable for this listing.</div>
          ) : (
            <>
              <div className="list-panel__preview-header">
                <div className="list-panel__preview-title">
                  {formatCurrency(selectedListing.price)} · {selectedListing.acres ?? 'N/A'} ac
                </div>
                <span className="pill">{brief.scoreLabel}</span>
              </div>
              <div className="list-panel__preview-flags">
                {brief.positives.slice(0, 3).map((positive) => (
                  <span key={positive} className="list-panel__preview-flag list-panel__preview-flag--good">
                    ✓ {positive}
                  </span>
                ))}
              </div>
              {brief.risks[0] ? (
                <div className="list-panel__preview-risk">{brief.risks[0]}</div>
              ) : (
                <div className="list-panel__preview-empty">No major automated risks flagged.</div>
              )}
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
