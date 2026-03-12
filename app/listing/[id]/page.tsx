export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';

import { db, schema } from '@/lib/db';
import { formatCurrency } from '@/lib/listing-helpers';

function formatDateTime(value: string | null) {
  if (!value) {
    return 'N/A';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'N/A' : date.toLocaleString();
}

function formatPercent(value: number | null | undefined) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) {
    return 'N/A';
  }

  return `${Math.round(amount)}%`;
}

function formatText(value: string | null | undefined, fallback = 'N/A') {
  const text = value?.trim();
  return text ? text : fallback;
}

export default async function ListingPage({ params }: { params: { id: string } }) {
  const [listing] = await db
    .select()
    .from(schema.listings)
    .where(eq(schema.listings.id, params.id))
    .limit(1);

  if (!listing) {
    notFound();
  }

  const location = [listing.city, listing.county ? `${listing.county} County` : null, listing.state]
    .filter(Boolean)
    .join(', ');

  const featureBadges = [
    listing.owner_financing ? 'Owner finance' : null,
    listing.has_trees ? 'Trees' : null,
    listing.has_water ? 'Water' : null,
    listing.has_road_access ? 'Road access' : null,
    listing.motivated_seller ? 'Motivated seller' : null,
    listing.price_reduced ? 'Price reduced' : null,
  ].filter(Boolean) as string[];

  return (
    <main className="listing-detail-page">
      <div className="listing-detail">
        <div className="listing-detail__topbar">
          <Link href="/map" className="listing-detail__back">
            ← Back to map
          </Link>
          {listing.url ? (
            <a className="popup-link" href={listing.url} target="_blank" rel="noreferrer">
              Open source listing →
            </a>
          ) : null}
        </div>

        <section className="listing-detail__hero">
          <div className="listing-detail__hero-copy">
            <div className="listing-detail__eyebrow">
              {formatText(listing.source, 'Unknown source')} · {listing.id}
            </div>
            <h1 className="listing-detail__title">{formatText(listing.title, 'Untitled listing')}</h1>
            <div className="listing-detail__location">
              {location || 'Location unavailable'}
            </div>
            {featureBadges.length ? (
              <div className="listing-detail__badges">
                {featureBadges.map((badge) => (
                  <span key={badge} className="pill">
                    {badge}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <div className="listing-detail__price-block">
            <div className="listing-detail__price">{formatCurrency(listing.price)}</div>
            <div className="listing-detail__price-meta">
              {listing.acres ?? 'N/A'} ac · {formatCurrency(listing.price_per_acre)}/ac
            </div>
            <div className="listing-detail__score">{listing.score}★ scout score</div>
          </div>
        </section>

        <div className="listing-detail__grid">
          <section className="listing-detail__section">
            <h2 className="listing-detail__section-title">Overview</h2>
            <dl className="listing-detail__facts">
              <div>
                <dt>State</dt>
                <dd>{formatText(listing.state)}</dd>
              </div>
              <div>
                <dt>County</dt>
                <dd>{formatText(listing.county)}</dd>
              </div>
              <div>
                <dt>Zoning</dt>
                <dd>{formatText(listing.zoning)}</dd>
              </div>
              <div>
                <dt>HOA risk</dt>
                <dd>{formatText(listing.hoa_risk)}</dd>
              </div>
              <div>
                <dt>Flood zone</dt>
                <dd>{formatText(listing.flood_zone)}</dd>
              </div>
              <div>
                <dt>Owner state</dt>
                <dd>{formatText(listing.owner_state)}</dd>
              </div>
            </dl>
          </section>

          <section className="listing-detail__section">
            <h2 className="listing-detail__section-title">Price history</h2>
            <dl className="listing-detail__facts">
              <div>
                <dt>Current price</dt>
                <dd>{formatCurrency(listing.price)}</dd>
              </div>
              <div>
                <dt>Original price</dt>
                <dd>{formatCurrency(listing.original_price)}</dd>
              </div>
              <div>
                <dt>Reduced</dt>
                <dd>{listing.price_reduced ? 'Yes' : 'No'}</dd>
              </div>
              <div>
                <dt>Drop percentage</dt>
                <dd>{formatPercent(listing.price_drop_pct)}</dd>
              </div>
            </dl>
            <p className="listing-detail__note">
              {listing.price_reduced
                ? 'Current snapshot indicates the parcel is listed below its original ask.'
                : 'No price reduction is recorded in the current snapshot.'}
            </p>
          </section>

          <section className="listing-detail__section">
            <h2 className="listing-detail__section-title">Market timing</h2>
            <dl className="listing-detail__facts">
              <div>
                <dt>Days on market</dt>
                <dd>{listing.days_on_market ?? 0}</dd>
              </div>
              <div>
                <dt>First seen</dt>
                <dd>{formatDateTime(listing.first_seen)}</dd>
              </div>
              <div>
                <dt>Last seen</dt>
                <dd>{formatDateTime(listing.last_seen)}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{formatText(listing.status)}</dd>
              </div>
            </dl>
          </section>

          <section className="listing-detail__section">
            <h2 className="listing-detail__section-title">Parcel facts</h2>
            <dl className="listing-detail__facts">
              <div>
                <dt>Latitude</dt>
                <dd>{listing.latitude ?? 'N/A'}</dd>
              </div>
              <div>
                <dt>Longitude</dt>
                <dd>{listing.longitude ?? 'N/A'}</dd>
              </div>
              <div>
                <dt>Nearest town</dt>
                <dd>{formatText(listing.nearest_town)}</dd>
              </div>
              <div>
                <dt>Drive hours</dt>
                <dd>{listing.drive_hours ?? 'N/A'}</dd>
              </div>
              <div>
                <dt>Estimated lease</dt>
                <dd>{formatCurrency(listing.est_annual_lease)}</dd>
              </div>
              <div>
                <dt>Assessed value</dt>
                <dd>{formatCurrency(listing.assessed_value)}</dd>
              </div>
            </dl>
          </section>
        </div>

        <section className="listing-detail__section listing-detail__section--full">
          <h2 className="listing-detail__section-title">Description</h2>
          <p className="listing-detail__description">
            {formatText(listing.description, 'No description captured for this parcel yet.')}
          </p>
        </section>
      </div>
    </main>
  );
}
