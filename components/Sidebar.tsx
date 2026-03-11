'use client';

import { useState } from 'react';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import * as Checkbox from '@radix-ui/react-checkbox';
import * as Select from '@radix-ui/react-select';
import * as Slider from '@radix-ui/react-slider';

import type { ListingFilters, Stats } from '@/lib/types';

function FilterGroup({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children: ReactNode;
}) {
  return (
    <section className="filter-group">
      <div className="filter-group__header">
        <span>{label}</span>
        {value ? <span className="filter-group__value">{value}</span> : null}
      </div>
      {children}
    </section>
  );
}

function FilterCheckbox({
  checked,
  onCheckedChange,
  children,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  children: ReactNode;
}) {
  return (
    <label className="checkbox-row">
      <Checkbox.Root
        className="checkbox-root"
        checked={checked}
        onCheckedChange={(nextChecked) => onCheckedChange(nextChecked === true)}
      >
        <Checkbox.Indicator className="checkbox-indicator">✓</Checkbox.Indicator>
      </Checkbox.Root>
      <span>{children}</span>
    </label>
  );
}

function RangeSlider({
  min,
  max,
  step = 1,
  value,
  onValueChange,
}: {
  min: number;
  max: number;
  step?: number;
  value: number;
  onValueChange: (value: number) => void;
}) {
  return (
    <Slider.Root
      className="slider-root"
      min={min}
      max={max}
      step={step}
      value={[value]}
      onValueChange={(next) => onValueChange(next[0] ?? value)}
    >
      <Slider.Track className="slider-track">
        <Slider.Range className="slider-range" />
      </Slider.Track>
      <Slider.Thumb className="slider-thumb" aria-label="Filter value" />
    </Slider.Root>
  );
}

function StateSelect({
  value,
  states,
  onValueChange,
}: {
  value: string;
  states: string[];
  onValueChange: (value: string) => void;
}) {
  return (
    <Select.Root
      value={value || '__all__'}
      onValueChange={(nextValue) => onValueChange(nextValue === '__all__' ? '' : nextValue)}
    >
      <Select.Trigger className="select-trigger" aria-label="State filter">
        <Select.Value placeholder="All states" />
        <Select.Icon className="select-icon">⌄</Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content className="select-content" position="popper" sideOffset={6}>
          <Select.Viewport className="select-viewport">
            <Select.Item value="__all__" className="select-item">
              <Select.ItemText>All states</Select.ItemText>
            </Select.Item>
            {states.map((state) => (
              <Select.Item key={state} value={state} className="select-item">
                <Select.ItemText>{state}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}

function RunScrapeButton() {
  const [status, setStatus] = useState<'idle' | 'running' | 'started' | 'error'>('idle');

  async function handleClick() {
    setStatus('running');
    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ triggered_from: 'sidebar' }),
      });

      if (!response.ok) {
        throw new Error(`Failed to trigger scrape (${response.status})`);
      }

      setStatus('started');
      window.setTimeout(() => setStatus('idle'), 5000);
    } catch {
      setStatus('error');
      window.setTimeout(() => setStatus('idle'), 3000);
    }
  }

  return (
    <button
      className={`primary-button primary-button--blue${status === 'running' ? ' primary-button--disabled' : ''}`}
      type="button"
      disabled={status === 'running'}
      onClick={handleClick}
    >
      {status === 'idle' && 'Run scrape'}
      {status === 'running' && 'Running...'}
      {status === 'started' && 'Started'}
      {status === 'error' && 'Error'}
    </button>
  );
}

export default function Sidebar({
  filters,
  onChange,
  onReset,
  stats,
}: {
  filters: ListingFilters;
  onChange: Dispatch<SetStateAction<ListingFilters>>;
  onReset: () => void;
  stats: Stats | null;
}) {
  const states = Object.keys(stats?.byState ?? {}).sort();

  function updateFilter<Key extends keyof ListingFilters>(key: Key, value: ListingFilters[Key]) {
    onChange((current) => ({ ...current, [key]: value }));
  }

  return (
    <aside className="sidebar">
      <div className="sidebar__header">
        <div className="sidebar__eyebrow">Filters</div>
        <h1 className="sidebar__title">Scout the current inventory</h1>
      </div>

      <FilterGroup label="Min score" value={`${filters.minScore}+`}>
        <RangeSlider
          min={0}
          max={100}
          value={filters.minScore}
          onValueChange={(value) => updateFilter('minScore', value)}
        />
      </FilterGroup>

      <FilterGroup label="Max price" value={`$${filters.maxPrice.toLocaleString()}`}>
        <RangeSlider
          min={1000}
          max={35000}
          step={500}
          value={filters.maxPrice}
          onValueChange={(value) => updateFilter('maxPrice', value)}
        />
      </FilterGroup>

      <FilterGroup label="Min acres" value={String(filters.minAcres)}>
        <RangeSlider
          min={1}
          max={50}
          value={filters.minAcres}
          onValueChange={(value) => updateFilter('minAcres', value)}
        />
      </FilterGroup>

      <FilterGroup label="State">
        <StateSelect
          value={filters.state}
          states={states}
          onValueChange={(value) => updateFilter('state', value)}
        />
      </FilterGroup>

      <div className="sidebar__checks">
        <FilterCheckbox
          checked={filters.ownerFinance}
          onCheckedChange={(checked) => updateFilter('ownerFinance', checked)}
        >
          Owner finance only
        </FilterCheckbox>
        <FilterCheckbox
          checked={filters.noHoa}
          onCheckedChange={(checked) => updateFilter('noHoa', checked)}
        >
          No high HOA risk
        </FilterCheckbox>
        <FilterCheckbox
          checked={filters.motivated}
          onCheckedChange={(checked) => updateFilter('motivated', checked)}
        >
          Motivated sellers
        </FilterCheckbox>
      </div>

      <div className="sidebar__actions">
        <button className="secondary-button" type="button" onClick={onReset}>
          Reset filters
        </button>
        <RunScrapeButton />
      </div>

      {stats ? (
        <section className="state-summary">
          <div className="state-summary__title">Listings by state</div>
          <div className="state-summary__rows">
            {Object.entries(stats.byState).map(([state, count]) => (
              <div key={state} className="state-summary__row">
                <span>{state}</span>
                <strong>{count}</strong>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="legend">
        <div className="legend__title">Score legend</div>
        <div className="legend__row">
          <span className="legend-dot legend-dot--green" />
          <span>90+ best fit</span>
        </div>
        <div className="legend__row">
          <span className="legend-dot legend-dot--yellow" />
          <span>75-89 strong</span>
        </div>
        <div className="legend__row">
          <span className="legend-dot legend-dot--orange" />
          <span>60-74 workable</span>
        </div>
        <div className="legend__row">
          <span className="legend-dot legend-dot--red" />
          <span>Below 60</span>
        </div>
      </section>
    </aside>
  );
}
