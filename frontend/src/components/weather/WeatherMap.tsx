import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, AlertTriangle, Cloud, Thermometer, Wind } from 'lucide-react';
import { CITY_COORDINATES, CityCoordinates } from '@/utils/cityCoordinates';
import { weatherService, Recommendation } from '@/services/weather';
import { StoreType } from '@/utils/constants';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

// Fix for default marker icons in React-Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface CityWeatherData {
  city: CityCoordinates;
  recommendations: Recommendation[];
  isLoading: boolean;
  error: string | null;
}

interface WeatherMapProps {
  storeType?: StoreType;
  riskThreshold?: number;
}

// Component to handle map view updates
function MapViewUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export const WeatherMap = ({ storeType, riskThreshold = 0.2 }: WeatherMapProps) => {
  const [cityWeatherData, setCityWeatherData] = useState<Map<string, CityWeatherData>>(new Map());
  const [isLoadingAll, setIsLoadingAll] = useState(true);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([39.8283, -98.5795]);

  useEffect(() => {
    loadAllCitiesWeather();
  }, [storeType, riskThreshold]);

  const loadAllCitiesWeather = async () => {
    setIsLoadingAll(true);
    const dataMap = new Map<string, CityWeatherData>();

    // Load weather data for all cities in parallel
    const promises = CITY_COORDINATES.map(async (city) => {
      try {
        const recommendations = await weatherService.getRecommendations(
          city.name,
          storeType,
          false,
          riskThreshold
        );
        dataMap.set(city.name, {
          city,
          recommendations,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        dataMap.set(city.name, {
          city,
          recommendations: [],
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to load data',
        });
      }
    });

    await Promise.all(promises);
    setCityWeatherData(dataMap);
    setIsLoadingAll(false);
  };

  const getRiskLevel = (recommendations: Recommendation[]): 'low' | 'medium' | 'high' | 'critical' => {
    if (recommendations.length === 0) return 'low';
    
    const riskLevels = recommendations.map((r) => r.risk_level);
    if (riskLevels.includes('critical')) return 'critical';
    if (riskLevels.includes('high')) return 'high';
    if (riskLevels.includes('medium')) return 'medium';
    return 'low';
  };

  const getMarkerColor = (riskLevel: string): string => {
    switch (riskLevel) {
      case 'critical':
        return '#ef4444'; // red
      case 'high':
        return '#f97316'; // orange
      case 'medium':
        return '#eab308'; // yellow
      case 'low':
        return '#22c55e'; // green
      default:
        return '#6b7280'; // gray
    }
  };

  const createCustomIcon = (color: string) => {
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
  };

  const handleMarkerClick = (cityName: string) => {
    setSelectedCity(cityName);
    const cityData = cityWeatherData.get(cityName);
    if (cityData) {
      setMapCenter([cityData.city.lat, cityData.city.lng]);
    }
  };

  const getEventIcon = (event: string) => {
    switch (event.toLowerCase()) {
      case 'cold':
        return <Thermometer className="w-4 h-4" />;
      case 'storm':
        return <Wind className="w-4 h-4" />;
      case 'fog':
        return <Cloud className="w-4 h-4" />;
      case 'heat':
        return <Thermometer className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  if (isLoadingAll) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="relative">
      <MapContainer
        center={mapCenter}
        zoom={4}
        style={{ height: '600px', width: '100%', borderRadius: '0.5rem' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapViewUpdater center={mapCenter} />
        
        {Array.from(cityWeatherData.entries()).map(([cityName, data]) => {
          const riskLevel = getRiskLevel(data.recommendations);
          const markerColor = getMarkerColor(riskLevel);
          const customIcon = createCustomIcon(markerColor);

          return (
            <Marker
              key={cityName}
              position={[data.city.lat, data.city.lng]}
              icon={customIcon}
              eventHandlers={{
                click: () => handleMarkerClick(cityName),
              }}
            >
              <Popup>
                <div className="min-w-[250px]">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-primary-600" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {data.city.name}
                      {data.city.state && `, ${data.city.state}`}
                    </h3>
                  </div>
                  
                  {data.error ? (
                    <p className="text-sm text-red-600 dark:text-red-400">{data.error}</p>
                  ) : data.recommendations.length === 0 ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="font-medium">Low Risk</span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        No active weather risks detected.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium mb-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: markerColor }}
                        ></div>
                        <span className="capitalize">{riskLevel} Risk</span>
                        <span className="text-xs text-gray-500">
                          ({data.recommendations.length} active)
                        </span>
                      </div>
                      
                      <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {data.recommendations.slice(0, 3).map((rec, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs"
                          >
                            <div className="mt-0.5">
                              {getEventIcon(rec.climate_event)}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 dark:text-white capitalize">
                                {rec.climate_event}
                              </div>
                              <div className="text-gray-600 dark:text-gray-400 capitalize">
                                {rec.risk_level} risk
                              </div>
                            </div>
                          </div>
                        ))}
                        {data.recommendations.length > 3 && (
                          <p className="text-xs text-gray-500 text-center pt-1">
                            +{data.recommendations.length - 3} more
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 z-[1000] border border-gray-200 dark:border-gray-700">
        <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-2">Risk Levels</h4>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-4 h-4 rounded-full bg-green-500"></div>
            <span className="text-gray-700 dark:text-gray-300">Low Risk</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
            <span className="text-gray-700 dark:text-gray-300">Medium Risk</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-4 h-4 rounded-full bg-orange-500"></div>
            <span className="text-gray-700 dark:text-gray-300">High Risk</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-4 h-4 rounded-full bg-red-500"></div>
            <span className="text-gray-700 dark:text-gray-300">Critical Risk</span>
          </div>
        </div>
      </div>
    </div>
  );
};
