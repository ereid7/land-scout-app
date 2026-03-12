'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import type { FormEvent } from 'react';

import { formatCurrency } from '@/lib/listing-helpers';

export interface LandingDeal {
  id: string;
  title: string | null;
  price: number | null;
  acres: number | null;
  state: string | null;
  county: string | null;
  score: number;
}

function formatAcres(value: number | null) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 'N/A acres';
  }

  return `${new Intl.NumberFormat('en-US', {
    maximumFractionDigits: value >= 10 ? 0 : 1,
  }).format(value)} acres`;
}

function formatLocation(deal: LandingDeal) {
  const parts = [deal.county ? `${deal.county} County` : null, deal.state].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : 'Location unavailable';
}

export default function LandingPage({
  totalCount,
  stateCount,
  topDeals,
}: {
  totalCount: number;
  stateCount: number;
  topDeals: LandingDeal[];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const listingsValue = totalCount > 0 ? totalCount.toLocaleString('en-US') : 'Thousands of';
  const listingsLabel = totalCount > 0 ? 'active listings' : 'listings scanned';
  const statesValue = stateCount > 0 ? stateCount.toLocaleString('en-US') : '19';

  const focusWaitlistForm = () => {
    const waitlistSection = document.getElementById('waitlist');
    waitlistSection?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.setTimeout(() => {
      inputRef.current?.focus();
    }, 180);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setStatus('submitting');
    setMessage('');

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const payload = (await response.json()) as { error?: string; ok?: boolean };

      if (!response.ok || !payload.ok) {
        setStatus('error');
        setMessage(payload.error ?? 'Something went wrong. Try again in a minute.');
        return;
      }

      setEmail('');
      setStatus('success');
      setMessage("You're in. We'll alert you when deals match your criteria.");
    } catch (error) {
      console.error('Failed to submit waitlist form', error);
      setStatus('error');
      setMessage('Something went wrong. Try again in a minute.');
    }
  };

  return (
    <main className="landing-page">
      <section className="landing-hero">
        <div className="landing-hero__backdrop" />
        <div className="landing-hero__content">
          <div className="landing-eyebrow">Land Scout</div>
          <h1 className="landing-hero__title">Find your land before the crowd does</h1>
          <p className="landing-hero__subtitle">
            Automated scanning of 90+ listing sources. Scored, filtered, and delivered to you.
          </p>

          <div className="landing-hero__actions">
            <Link className="landing-button landing-button--primary" href="/map">
              View the Map &rarr;
            </Link>
            <button
              className="landing-button landing-button--secondary"
              type="button"
              onClick={focusWaitlistForm}
            >
              Get Deal Alerts
            </button>
          </div>

          <div className="stats-row" aria-label="Land Scout live stats">
            <div className="stats-row__item">
              <span className="stats-row__value">{listingsValue}</span>
              <span className="stats-row__label">{listingsLabel}</span>
            </div>
            <div className="stats-row__divider" aria-hidden="true" />
            <div className="stats-row__item">
              <span className="stats-row__value">{statesValue}</span>
              <span className="stats-row__label">states tracked</span>
            </div>
            <div className="stats-row__divider" aria-hidden="true" />
            <div className="stats-row__item">
              <span className="stats-row__value">Weekly</span>
              <span className="stats-row__label">updated cadence</span>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section" id="deals">
        <div className="landing-section__header">
          <div>
            <div className="landing-section__eyebrow">Live preview</div>
            <h2 className="landing-section__title">Top deals right now &rarr;</h2>
          </div>
          <Link className="landing-inline-link" href="/map">
            Browse the full map
          </Link>
        </div>

        {topDeals.length > 0 ? (
          <div className="deal-grid">
            {topDeals.map((deal) => (
              <article className="deal-card" key={deal.id}>
                <div className="deal-card__top">
                  <span className="deal-card__score">{deal.score}</span>
                  <span className="deal-card__label">Scout score</span>
                </div>
                <div className="deal-card__price">{formatCurrency(deal.price)}</div>
                <div className="deal-card__meta">{formatAcres(deal.acres)}</div>
                <div className="deal-card__location">{formatLocation(deal)}</div>
                <div className="deal-card__title">{deal.title?.trim() || 'Fresh rural land lead'}</div>
                <Link className="deal-card__link" href={`/listing/${deal.id}`}>
                  View &rarr;
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="landing-empty">
            Live deal previews appear here when the listing database is connected.
          </div>
        )}
      </section>

      <section className="landing-section" id="how-it-works">
        <div className="landing-section__header">
          <div>
            <div className="landing-section__eyebrow">How it works</div>
            <h2 className="landing-section__title">From thousands of listings to a shortlist worth opening</h2>
          </div>
        </div>

        <div className="steps-grid">
          <article className="step-card">
            <div className="step-card__index">01</div>
            <h3 className="step-card__title">🔍 We scan 90+ sources</h3>
            <p className="step-card__copy">
              LandWatch, LandFlip, county tax sales, and regional brokers feed a single pipeline.
            </p>
          </article>
          <article className="step-card">
            <div className="step-card__index">02</div>
            <h3 className="step-card__title">🧮 AI scores every listing</h3>
            <p className="step-card__copy">
              Price per acre, water, timber, road access, and HOA-free signals get rolled into one score.
            </p>
          </article>
          <article className="step-card">
            <div className="step-card__index">03</div>
            <h3 className="step-card__title">📬 You get the best ones</h3>
            <p className="step-card__copy">
              Use the filtered map now, then get email alerts when new deals match what matters to you.
            </p>
          </article>
        </div>
      </section>

      <section className="landing-section landing-section--why-now" id="about">
        <div className="landing-section__header">
          <div>
            <div className="landing-section__eyebrow">Why now</div>
            <h2 className="landing-section__title">
              Remote work freed people from cities. The coming decade belongs to rural land.
            </h2>
          </div>
        </div>

        <div className="why-now">
          <p className="why-now__lead">
            Buyers are moving earlier, inventory is fragmented, and the best owner-financed parcels disappear before most people ever hear about them.
          </p>
          <ul className="why-now__list">
            <li>Rural land prices still 10-50x cheaper than suburban lots</li>
            <li>County tax sales create once-a-year buying opportunities most buyers miss</li>
            <li>Owner financing makes land accessible without a mortgage</li>
          </ul>
        </div>
      </section>

      <section className="landing-section landing-section--waitlist" id="waitlist">
        <div className="landing-section__header">
          <div>
            <div className="landing-section__eyebrow">Waitlist</div>
            <h2 className="landing-section__title">Get deal alerts without the spammy funnel</h2>
          </div>
        </div>

        <div className="waitlist-panel">
          <p className="waitlist-panel__copy">
            Enter your email and we&apos;ll send the best new rural land matches as the feed updates.
          </p>

          <form className="waitlist-form" onSubmit={handleSubmit}>
            <label className="sr-only" htmlFor="waitlist-email">
              Email address
            </label>
            <input
              ref={inputRef}
              id="waitlist-email"
              className="waitlist-form__input"
              type="email"
              name="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={status === 'submitting'}
              required
            />
            <button
              className="landing-button landing-button--primary waitlist-form__button"
              type="submit"
              disabled={status === 'submitting'}
            >
              {status === 'submitting' ? 'Submitting...' : 'Get Deal Alerts'}
            </button>
          </form>

          <p
            className={`waitlist-form__message${
              status === 'success'
                ? ' waitlist-form__message--success'
                : status === 'error'
                  ? ' waitlist-form__message--error'
                  : ''
            }`}
            aria-live="polite"
          >
            {message || 'No spam. Just the best parcels we find.'}
          </p>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-footer__links">
          <Link href="/map">Map</Link>
          <a href="#about">About</a>
          <a href="https://github.com/ereid7/land-scout-app" target="_blank" rel="noreferrer">
            GitHub
          </a>
        </div>
        <div className="landing-footer__meta">Built by sofi · land-scout.app</div>
      </footer>
    </main>
  );
}
