import { assertType } from 'vitest';

import type { ListingFeatureCollection, ListingFilters, ListingWithLocation, Stats } from '@/lib/types';
import { createListing } from '@/tests/factories';

describe('lib/types exports', () => {
  it('support the expected shapes', () => {
    const listingWithLocation = {
      ...createListing({
        latitude: 44.98,
        longitude: -93.26,
      }),
      has_exact_coordinates: true,
      location_source: 'listing' as const,
    };

    const filters = {
      minScore: 80,
      maxPrice: 25000,
      minAcres: 5,
      state: 'Missouri',
      ownerFinance: true,
      noHoa: true,
      motivated: false,
    };

    const stats = {
      total: 3,
      avgScore: 82.3,
      byState: {
        Missouri: 2,
      },
      lastRun: '2026-03-11T18:00:00.000Z',
    };

    const featureCollection = {
      type: 'FeatureCollection' as const,
      features: [
        {
          type: 'Feature' as const,
          geometry: {
            type: 'Point' as const,
            coordinates: [-93.26, 44.98] as [number, number],
          },
          properties: listingWithLocation,
        },
      ],
    };

    assertType<ListingWithLocation>(listingWithLocation);
    assertType<ListingFilters>(filters);
    assertType<Stats>(stats);
    assertType<ListingFeatureCollection>(featureCollection);

    expect(featureCollection.features[0]?.properties.location_source).toBe('listing');
  });
});
