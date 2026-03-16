/**
 * Google Places API utility
 * Falls back to mock data if API key is not configured
 */

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || '';

const MOCK_AUTOCOMPLETE = {
  predictions: [
    {
      place_id: 'mock_1',
      description: 'Central Park, New York, NY, USA',
      structured_formatting: {
        main_text: 'Central Park',
        secondary_text: 'New York, NY, USA',
      },
    },
    {
      place_id: 'mock_2',
      description: 'Times Square, New York, NY, USA',
      structured_formatting: {
        main_text: 'Times Square',
        secondary_text: 'New York, NY, USA',
      },
    },
    {
      place_id: 'mock_3',
      description: 'The Coffee Bean & Tea Leaf, Los Angeles, CA, USA',
      structured_formatting: {
        main_text: 'The Coffee Bean & Tea Leaf',
        secondary_text: 'Los Angeles, CA, USA',
      },
    },
    {
      place_id: 'mock_4',
      description: 'Golden Gate Park, San Francisco, CA, USA',
      structured_formatting: {
        main_text: 'Golden Gate Park',
        secondary_text: 'San Francisco, CA, USA',
      },
    },
    {
      place_id: 'mock_5',
      description: 'Millennium Park, Chicago, IL, USA',
      structured_formatting: {
        main_text: 'Millennium Park',
        secondary_text: 'Chicago, IL, USA',
      },
    },
  ],
};

const MOCK_DETAILS = {
  name: 'Central Park',
  formatted_address: 'Central Park, New York, NY 10024, USA',
  lat: 40.7851,
  lng: -73.9683,
  types: ['park', 'establishment', 'point_of_interest'],
};

/**
 * Get place autocomplete predictions
 */
export async function getPlaceAutocomplete(input: string): Promise<Record<string, any>> {
  // Use mock data if API key is not configured
  if (!GOOGLE_PLACES_API_KEY) {
    return MOCK_AUTOCOMPLETE;
  }

  try {
    const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
    url.searchParams.set('input', input);
    url.searchParams.set('types', 'establishment|geocode');
    url.searchParams.set('key', GOOGLE_PLACES_API_KEY);

    const response = await fetch(url.toString());

    if (!response.ok) {
      console.error(`Google Places API error: ${response.statusText}`);
      return MOCK_AUTOCOMPLETE;
    }

    const data = await response.json() as Record<string, any>;

    if (data.error_message) {
      console.error(`Google Places API error: ${data.error_message}`);
      return MOCK_AUTOCOMPLETE;
    }

    // Transform predictions to return only required fields
    const predictions = (data.predictions as any[] || []).map((p: any) => ({
      place_id: p.place_id,
      description: p.description,
      structured_formatting: {
        main_text: p.structured_formatting?.main_text || '',
        secondary_text: p.structured_formatting?.secondary_text || '',
      },
    }));

    return { predictions };
  } catch (error) {
    console.error('Error calling Google Places Autocomplete API:', error);
    return MOCK_AUTOCOMPLETE;
  }
}

/**
 * Get place details
 */
export async function getPlaceDetails(placeId: string): Promise<Record<string, any> | null> {
  // Use mock data if API key is not configured
  if (!GOOGLE_PLACES_API_KEY) {
    return MOCK_DETAILS;
  }

  try {
    const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
    url.searchParams.set('place_id', placeId);
    url.searchParams.set('fields', 'name,formatted_address,geometry,types');
    url.searchParams.set('key', GOOGLE_PLACES_API_KEY);

    const response = await fetch(url.toString());

    if (!response.ok) {
      console.error(`Google Places API error: ${response.statusText}`);
      return null;
    }

    const data = await response.json() as Record<string, any>;

    if (data.error_message) {
      console.error(`Google Places API error: ${data.error_message}`);
      return null;
    }

    if (!data.result) {
      return null;
    }

    const result = data.result as Record<string, any>;

    return {
      name: result.name || '',
      formatted_address: result.formatted_address || '',
      lat: result.geometry?.location?.lat || null,
      lng: result.geometry?.location?.lng || null,
      types: result.types || [],
    };
  } catch (error) {
    console.error('Error calling Google Places Details API:', error);
    return null;
  }
}
