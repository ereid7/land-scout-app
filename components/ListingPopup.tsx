import { formatCurrency } from '@/lib/listing-helpers';
import type { ListingWithLocation } from '@/lib/types';

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function scoreTone(score: number) {
  if (score >= 90) {
    return 'popup-score--green';
  }
  if (score >= 75) {
    return 'popup-score--yellow';
  }
  if (score >= 60) {
    return 'popup-score--orange';
  }
  return 'popup-score--red';
}

function badgeList(listing: ListingWithLocation) {
  const badges: string[] = [];
  if (listing.owner_financing) {
    badges.push('Owner Finance');
  }
  if (listing.has_water) {
    badges.push('Water');
  }
  if (listing.has_trees) {
    badges.push('Trees');
  }
  if (listing.motivated_seller) {
    badges.push('Motivated');
  }
  if ((listing.price_drop_pct ?? 0) > 0) {
    badges.push(`-${Math.round(listing.price_drop_pct ?? 0)}%`);
  }
  if (!listing.has_exact_coordinates && listing.location_source === 'state_centroid') {
    badges.push('Approximate pin');
  }
  return badges;
}

export function ListingPopup({ listing }: { listing: ListingWithLocation }) {
  const badges = badgeList(listing);

  return (
    <div className="popup-card">
      <div className={`popup-score ${scoreTone(listing.score)}`}>{listing.score}★</div>
      <div className="popup-price">
        {formatCurrency(listing.price)} · {listing.acres ?? 'N/A'} ac
      </div>
      <div className="popup-meta">
        {listing.price_per_acre && listing.price_per_acre > 0
          ? `${formatCurrency(listing.price_per_acre)}/ac`
          : 'Price per acre unavailable'}
      </div>
      <div className="popup-meta">
        {[listing.city, listing.county ? `${listing.county} Co.` : '', listing.state]
          .filter(Boolean)
          .join(', ')}
      </div>
      {badges.length ? (
        <div className="popup-badges">
          {badges.map((badge) => (
            <span key={badge} className="popup-badge">
              {badge}
            </span>
          ))}
        </div>
      ) : null}
      {(listing.days_on_market ?? 0) > 0 ? (
        <div className="popup-meta">{listing.days_on_market} days on market</div>
      ) : null}
      {listing.url ? (
        <a className="popup-link" href={listing.url} target="_blank" rel="noreferrer">
          View listing →
        </a>
      ) : null}
    </div>
  );
}

export function renderPopupMarkup(listing: ListingWithLocation) {
  const badges = badgeList(listing)
    .map((badge) => `<span class="popup-badge">${escapeHtml(badge)}</span>`)
    .join('');

  const location = [listing.city, listing.county ? `${listing.county} Co.` : '', listing.state]
    .filter(Boolean)
    .join(', ');

  const marketText =
    (listing.days_on_market ?? 0) > 0
      ? `<div class="popup-meta">${escapeHtml(listing.days_on_market)} days on market</div>`
      : '';

  const link = listing.url
    ? `<a class="popup-link" href="${escapeHtml(listing.url)}" target="_blank" rel="noreferrer">View listing →</a>`
    : '';

  return `
    <div class="popup-card">
      <div class="popup-score ${scoreTone(listing.score)}">${escapeHtml(listing.score)}★</div>
      <div class="popup-price">${escapeHtml(formatCurrency(listing.price))} · ${escapeHtml(listing.acres ?? 'N/A')} ac</div>
      <div class="popup-meta">${
        listing.price_per_acre && listing.price_per_acre > 0
          ? `${escapeHtml(formatCurrency(listing.price_per_acre))}/ac`
          : 'Price per acre unavailable'
      }</div>
      <div class="popup-meta">${escapeHtml(location)}</div>
      ${badges ? `<div class="popup-badges">${badges}</div>` : ''}
      ${marketText}
      ${link}
    </div>
  `.trim();
}

export default ListingPopup;
