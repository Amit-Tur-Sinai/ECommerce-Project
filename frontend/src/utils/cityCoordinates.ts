// City coordinates for map display
export interface CityCoordinates {
  name: string;
  lat: number;
  lng: number;
  state?: string;
  country?: string;
}

export const CITY_COORDINATES: CityCoordinates[] = [
  { name: 'Chesterfield', lat: 38.6631, lng: -90.5771, state: 'Missouri', country: 'USA' },
  { name: 'New York', lat: 40.7128, lng: -74.0060, state: 'New York', country: 'USA' },
  { name: 'Los Angeles', lat: 34.0522, lng: -118.2437, state: 'California', country: 'USA' },
  { name: 'Chicago', lat: 41.8781, lng: -87.6298, state: 'Illinois', country: 'USA' },
  { name: 'Houston', lat: 29.7604, lng: -95.3698, state: 'Texas', country: 'USA' },
  { name: 'Phoenix', lat: 33.4484, lng: -112.0740, state: 'Arizona', country: 'USA' },
  { name: 'Philadelphia', lat: 39.9526, lng: -75.1652, state: 'Pennsylvania', country: 'USA' },
  { name: 'San Antonio', lat: 29.4241, lng: -98.4936, state: 'Texas', country: 'USA' },
  { name: 'San Diego', lat: 32.7157, lng: -117.1611, state: 'California', country: 'USA' },
  { name: 'Dallas', lat: 32.7767, lng: -96.7970, state: 'Texas', country: 'USA' },
  { name: 'San Jose', lat: 37.3382, lng: -121.8863, state: 'California', country: 'USA' },
  { name: 'Austin', lat: 30.2672, lng: -97.7431, state: 'Texas', country: 'USA' },
  { name: 'Jacksonville', lat: 30.3322, lng: -81.6557, state: 'Florida', country: 'USA' },
  { name: 'Fort Worth', lat: 32.7555, lng: -97.3308, state: 'Texas', country: 'USA' },
  { name: 'Columbus', lat: 39.9612, lng: -82.9988, state: 'Ohio', country: 'USA' },
  { name: 'Charlotte', lat: 35.2271, lng: -80.8431, state: 'North Carolina', country: 'USA' },
  { name: 'San Francisco', lat: 37.7749, lng: -122.4194, state: 'California', country: 'USA' },
  { name: 'Indianapolis', lat: 39.7684, lng: -86.1581, state: 'Indiana', country: 'USA' },
  { name: 'Seattle', lat: 47.6062, lng: -122.3321, state: 'Washington', country: 'USA' },
  { name: 'Denver', lat: 39.7392, lng: -104.9903, state: 'Colorado', country: 'USA' },
  { name: 'Boston', lat: 42.3601, lng: -71.0589, state: 'Massachusetts', country: 'USA' },
  { name: 'Miami', lat: 25.7617, lng: -80.1918, state: 'Florida', country: 'USA' },
  { name: 'Atlanta', lat: 33.7490, lng: -84.3880, state: 'Georgia', country: 'USA' },
  { name: 'Detroit', lat: 42.3314, lng: -83.0458, state: 'Michigan', country: 'USA' },
  { name: 'Minneapolis', lat: 44.9778, lng: -93.2650, state: 'Minnesota', country: 'USA' },
];

export const getCityCoordinates = (cityName: string): CityCoordinates | undefined => {
  return CITY_COORDINATES.find(
    (city) => city.name.toLowerCase() === cityName.toLowerCase()
  );
};

export const getDefaultCenter = (): [number, number] => {
  // Center of USA
  return [39.8283, -98.5795];
};
