'use client';

import { useEffect, useState } from 'react';

import { useBrief } from '@/hooks/useBrief';
import type { ListingBrief } from '@/lib/brief';
import { formatCurrency } from '@/lib/listing-helpers';

function toneForScoreLabel(scoreLabel: ListingBrief['scoreLabel']) {
  if (scoreLabel === 'Strong Deal') {
    return 'good';
  }
  if (scoreLabel === 'Good Value') {
    return 'accent';
  }
  if (scoreLabel === 'Fair') {
    return 'warn';
  }
  return 'risk';
}

function formatValue(value: number | null | undefined, suffix = '') {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) {
    return 'N/A';
  }

  return `${amount.toLocaleString('en-US')}${suffix}`;
}

function formatGeneratedAt(value: string) {
  const timestamp = new Date(value);
  return Number.isNaN(timestamp.getTime()) ? 'Just now' : timestamp.toLocaleString();
}

type ChecklistState = Record<string, boolean>;

export default function PropertyBrief({ listingId }: { listingId: string }) {
  const { brief, loading, error } = useBrief(listingId);
  const [checklistState, setChecklistState] = useState<ChecklistState | null>(null);
  const storageKey = `land-scout:brief-checklist:${listingId}`;

  useEffect(() => {
    if (!brief) {
      setChecklistState(null);
      return;
    }

    const baseState = Object.fromEntries(brief.checklist.map((item) => [item.item, item.done])) as ChecklistState;

    try {
      const rawState = window.localStorage.getItem(storageKey);
      if (!rawState) {
        setChecklistState(baseState);
        return;
      }

      const parsed = JSON.parse(rawState) as Record<string, unknown>;
      const mergedState = { ...baseState };

      Object.entries(parsed).forEach(([item, done]) => {
        if (typeof done === 'boolean' && item in mergedState) {
          mergedState[item] = done;
        }
      });

      setChecklistState(mergedState);
    } catch {
      setChecklistState(baseState);
    }
  }, [brief, storageKey]);

  useEffect(() => {
    if (!brief || checklistState === null) {
      return;
    }

    window.localStorage.setItem(storageKey, JSON.stringify(checklistState));
  }, [brief, checklistState, storageKey]);

  if (loading) {
    return (
      <section className="listing-detail__section listing-detail__section--full listing-brief">
        <div className="listing-brief__header">
          <div>
            <div className="listing-detail__eyebrow">Property Brief</div>
            <h2 className="listing-detail__section-title">Generating due diligence summary...</h2>
          </div>
        </div>
      </section>
    );
  }

  if (error || !brief) {
    return (
      <section className="listing-detail__section listing-detail__section--full listing-brief">
        <div className="listing-brief__header">
          <div>
            <div className="listing-detail__eyebrow">Property Brief</div>
            <h2 className="listing-detail__section-title">Property brief unavailable</h2>
          </div>
        </div>
        <p className="listing-detail__note">{error || 'The brief could not be generated for this listing.'}</p>
      </section>
    );
  }

  const scoreTone = toneForScoreLabel(brief.scoreLabel);
  const checklist = brief.checklist.map((item) => ({
    ...item,
    done: checklistState?.[item.item] ?? item.done,
  }));

  const landHighlights = [
    {
      label: 'Water',
      value: brief.land.hasWater ? 'Present' : 'Not confirmed',
      tone: brief.land.hasWater ? 'good' : 'muted',
      icon: '💧',
    },
    {
      label: 'Trees',
      value: brief.land.hasTrees ? 'Present' : 'Open ground',
      tone: brief.land.hasTrees ? 'good' : 'muted',
      icon: '🌲',
    },
    {
      label: 'Road',
      value: brief.land.hasRoadAccess ? 'Confirmed' : 'Needs verification',
      tone: brief.land.hasRoadAccess ? 'good' : 'risk',
      icon: '🛣️',
    },
    {
      label: 'Flood',
      value: brief.land.inFloodplain ? 'Floodplain' : 'Outside floodplain',
      tone: brief.land.inFloodplain ? 'risk' : 'good',
      icon: '⚠️',
    },
    {
      label: 'Elevation',
      value: brief.land.elevation ? `${formatValue(brief.land.elevation)} ft` : 'N/A',
      tone: 'accent',
      icon: '⛰️',
    },
  ];

  const quickLinks = [
    { label: 'County GIS', href: brief.externalLinks.countyGIS },
    { label: 'FEMA Flood Map', href: brief.externalLinks.femaFloodMap },
    { label: 'Soil Survey', href: brief.externalLinks.soilSurvey },
  ].filter((link): link is { label: string; href: string } => Boolean(link.href));

  return (
    <section className="listing-detail__section listing-detail__section--full listing-brief">
      <div className="listing-brief__header">
        <div>
          <div className="listing-detail__eyebrow">Property Brief</div>
          <h2 className="listing-detail__section-title">{brief.headline}</h2>
          <p className="listing-brief__generated">Generated {formatGeneratedAt(brief.generatedAt)}</p>
        </div>
        <div className="listing-brief__actions">
          <span className={`listing-brief__score-badge listing-brief__score-badge--${scoreTone}`}>
            {brief.scoreLabel}
          </span>
          <button
            className="secondary-button listing-brief__print-button"
            type="button"
            onClick={() => window.print()}
          >
            Print Brief
          </button>
        </div>
      </div>

      <div className="listing-brief__layout">
        <section className="listing-brief__card">
          <div className="listing-brief__card-title">Financials</div>
          <table className="brief-table">
            <tbody>
              <tr>
                <th>Asking price</th>
                <td>{formatCurrency(brief.financials.askingPrice)}</td>
              </tr>
              <tr>
                <th>Price per acre</th>
                <td>{formatCurrency(brief.financials.pricePerAcre)}</td>
              </tr>
              <tr>
                <th>Original price</th>
                <td>{formatCurrency(brief.financials.originalPrice)}</td>
              </tr>
              <tr>
                <th>Price drop</th>
                <td>{brief.financials.priceDrop ? `${Math.round(brief.financials.priceDrop)}%` : 'N/A'}</td>
              </tr>
              <tr>
                <th>Est. annual tax</th>
                <td>{formatCurrency(brief.financials.estimatedAnnualTax)}</td>
              </tr>
            </tbody>
          </table>
          {brief.financials.ownerFinancing ? (
            <div className="listing-brief__subtle-row">
              <span className="pill">Owner financing</span>
            </div>
          ) : null}
        </section>

        <section className="listing-brief__card">
          <div className="listing-brief__card-title">Land Quality</div>
          <div className="listing-brief__highlights">
            {landHighlights.map((highlight) => (
              <div key={highlight.label} className={`listing-brief__highlight listing-brief__highlight--${highlight.tone}`}>
                <span className="listing-brief__highlight-icon" aria-hidden="true">
                  {highlight.icon}
                </span>
                <div>
                  <div className="listing-brief__highlight-label">{highlight.label}</div>
                  <div className="listing-brief__highlight-value">{highlight.value}</div>
                </div>
              </div>
            ))}
          </div>
          {brief.land.zoning ? (
            <div className="listing-brief__subtle-row">
              <span className="pill">Zoning: {brief.land.zoning}</span>
            </div>
          ) : null}
        </section>

        <section className="listing-brief__card">
          <div className="listing-brief__card-title">Location</div>
          <dl className="listing-brief__facts">
            <div>
              <dt>Nearest town</dt>
              <dd>{brief.location.nearestTown || 'N/A'}</dd>
            </div>
            <div>
              <dt>Town distance</dt>
              <dd>{brief.location.townDistanceMiles ? `${brief.location.townDistanceMiles} mi` : 'N/A'}</dd>
            </div>
            <div>
              <dt>Road distance</dt>
              <dd>{brief.location.roadDistanceFt ? `${brief.location.roadDistanceFt} ft` : 'N/A'}</dd>
            </div>
            <div>
              <dt>Water distance</dt>
              <dd>{brief.location.waterDistanceFt ? `${brief.location.waterDistanceFt} ft` : 'N/A'}</dd>
            </div>
          </dl>
        </section>

        <section className="listing-brief__card">
          <div className="listing-brief__card-title">Risk Flags</div>
          <div className="listing-brief__flag-list">
            {brief.risks.length ? (
              brief.risks.map((risk) => (
                <span key={risk} className="listing-brief__flag listing-brief__flag--risk">
                  {risk}
                </span>
              ))
            ) : (
              <span className="listing-brief__empty">No major automated risks flagged.</span>
            )}
          </div>
        </section>

        <section className="listing-brief__card">
          <div className="listing-brief__card-title">Green Flags</div>
          <div className="listing-brief__flag-list">
            {brief.positives.length ? (
              brief.positives.map((positive) => (
                <span key={positive} className="listing-brief__flag listing-brief__flag--good">
                  ✓ {positive}
                </span>
              ))
            ) : (
              <span className="listing-brief__empty">No standout positives were auto-detected.</span>
            )}
          </div>
        </section>

        <section className="listing-brief__card">
          <div className="listing-brief__card-title">Due Diligence Checklist</div>
          <div className="brief-checklist">
            {checklist.map((item) => (
              <label key={item.item} className="brief-checklist__item">
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={() =>
                    setChecklistState((current) => ({
                      ...(current ?? {}),
                      [item.item]: !item.done,
                    }))
                  }
                />
                <span>{item.item}</span>
              </label>
            ))}
          </div>
        </section>

        <section className="listing-brief__card">
          <div className="listing-brief__card-title">Quick Links</div>
          <div className="listing-brief__links">
            {quickLinks.length ? (
              quickLinks.map((link) => (
                <a key={link.label} className="popup-link popup-btn" href={link.href} target="_blank" rel="noreferrer">
                  {link.label}
                </a>
              ))
            ) : (
              <span className="listing-brief__empty">No location-based links available for this parcel.</span>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}
