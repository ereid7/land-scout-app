'use client';

import { useState } from 'react';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import * as Checkbox from '@radix-ui/react-checkbox';
import * as Select from '@radix-ui/react-select';
import * as Slider from '@radix-ui/react-slider';

import { authClient } from '@/lib/auth/client';
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
  const { data: session } = authClient.useSession();
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const states = Object.keys(stats?.byState ?? {}).sort();

  function updateFilter<Key extends keyof ListingFilters>(key: Key, value: ListingFilters[Key]) {
    onChange((current) => ({ ...current, [key]: value }));
  }

  async function handleSaveSearch() {
    if (!session?.user) {
      return;
    }

    const defaultName = filters.state ? `${filters.state} watchlist` : 'Land Scout search';
    const name = window.prompt('Name this saved search', defaultName)?.trim();
    if (!name) {
      return;
    }

    setSaveState('saving');

    try {
      const response = await fetch('/api/saved-searches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          filters,
          notify: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save search (${response.status})`);
      }

      setSaveState('saved');
      window.setTimeout(() => setSaveState('idle'), 3000);
    } catch {
      setSaveState('error');
      window.setTimeout(() => setSaveState('idle'), 3000);
    }
  }

  return (
    <aside className="sidebar app-sidebar">
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

      <FilterGroup
        label="Drive time from"
        value={filters.driveTimeCity.trim() ? `Within ${filters.driveTimeHours}h` : undefined}
      >
        <input
          type="text"
          className="filter-input"
          placeholder="Minneapolis, MN"
          value={filters.driveTimeCity}
          onChange={(event) => {
            const nextCity = event.target.value;
            onChange((current) => ({
              ...current,
              driveTimeCity: nextCity,
              driveTimeLat: null,
              driveTimeLng: null,
            }));
          }}
        />
        {filters.driveTimeCity.trim() ? (
          <select
            className="filter-select"
            value={filters.driveTimeHours}
            onChange={(event) => updateFilter('driveTimeHours', Number(event.target.value))}
          >
            <option value={1}>Within 1 hour</option>
            <option value={2}>Within 2 hours</option>
            <option value={3}>Within 3 hours</option>
            <option value={4}>Within 4 hours</option>
          </select>
        ) : null}
      </FilterGroup>

      <div className="sidebar__checks">
        <FilterCheckbox
          checked={filters.ownerFinance}
          onCheckedChange={(checked) => updateFilter('ownerFinance', checked)}
        >
          Owner finance only
        </FilterCheckbox>
        <FilterCheckbox checked={filters.noHoa} onCheckedChange={(checked) => updateFilter('noHoa', checked)}>
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
        {session?.user ? (
          <button
            className={`primary-button primary-button--blue${
              saveState === 'saving' ? ' primary-button--disabled' : ''
            }`}
            type="button"
            disabled={saveState === 'saving'}
            onClick={handleSaveSearch}
          >
            {saveState === 'idle' && 'Save Search'}
            {saveState === 'saving' && 'Saving...'}
            {saveState === 'saved' && 'Saved'}
            {saveState === 'error' && 'Error'}
          </button>
        ) : (
          <a className="primary-button primary-button--blue" href="/auth/sign-in">
            Sign in to save searches
          </a>
        )}
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
