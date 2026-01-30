import { useQuery } from '@tanstack/react-query';
import { weatherService, Recommendation } from '@/services/weather';
import { StoreType } from '@/utils/constants';

export const useWeatherRecommendations = (
  cityName: string,
  storeType?: StoreType,
  enabled: boolean = true,
  useHistorical: boolean = false,
  riskThreshold: number = 0.2
) => {
  return useQuery<Recommendation[]>({
    queryKey: ['weather-recommendations', cityName, storeType, riskThreshold],
    queryFn: () => weatherService.getRecommendations(cityName, storeType, false, riskThreshold),
    enabled: enabled && !!cityName,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};
