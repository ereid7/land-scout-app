import {
  formatCurrency,
  listingsToFeatureCollection,
  normalizeFeatureCollection,
  toListingWithLocation,
} from '@/lib/listing-helpers';
import { createListing } from '@/tests/factories';

describe('listing-helpers', () => {
  it('returns an empty FeatureCollection for empty listings', () => {
    expect(listingsToFeatureCollection([])).toEqual({
      type: 'FeatureCollection',
      features: [],
    });
  });

  it('uses exact coordinates when latitude and longitude are present', () => {
    const listing = createListing({
      latitude: 44.123456,
      longitude: -93.123456,
    });

    const collection = listingsToFeatureCollection([listing]);

    expect(collection.features[0]?.geometry.coordinates).toEqual([-93.123456, 44.123456]);
  });

  it('uses deterministic jittered state centroid coordinates when latitude and longitude are missing', () => {
    const listing = createListing({
      id: 'listing-2',
      state: 'Missouri',
      latitude: null,
      longitude: null,
    });

    expect(toListingWithLocation(listing)).toMatchObject({
      longitude: -92.140995,
      latitude: 38.031799,
      has_exact_coordinates: false,
      location_source: 'state_centroid',
    });
  });

  it('formats a numeric price in USD', () => {
    expect(formatCurrency(9500)).toBe('$9,500');
  });

  it('returns N/A for an empty price', () => {
    expect(formatCurrency(null)).toBe('N/A');
  });

  it('marks exact coordinates when the listing already has them', () => {
    const listing = createListing({
      latitude: 44.98,
      longitude: -93.26,
    });

    expect(toListingWithLocation(listing)).toMatchObject({
      latitude: 44.98,
      longitude: -93.26,
      has_exact_coordinates: true,
      location_source: 'listing',
    });
  });

  it('marks inexact coordinates when the listing needs a centroid fallback', () => {
    const listing = createListing({
      id: 'listing-3',
      state: 'Minnesota',
      latitude: null,
      longitude: null,
    });

    const mapped = toListingWithLocation(listing);

    expect(mapped.has_exact_coordinates).toBe(false);
    expect(mapped.location_source).toBe('state_centroid');
  });

  it('round-trips normalized feature collections through listingsToFeatureCollection', () => {
    const listings = [
      createListing({
        id: 'listing-exact',
        latitude: 44.98,
        longitude: -93.26,
      }),
      createListing({
        id: 'listing-2',
        state: 'Missouri',
        latitude: null,
        longitude: null,
      }),
    ];

    expect(normalizeFeatureCollection(listingsToFeatureCollection(listings))).toEqual(
      listings.map((listing) => toListingWithLocation(listing)),
    );
  });
});
