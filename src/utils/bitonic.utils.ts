import { PerformanceMetrics, measurePerformance } from './measurePerformance';
import BitonicService, { SortStrategy } from '../services/BitonicService';
import Coordinate from '../models/Coordinate';
import { IPoiData } from '../models/models';

export interface BitonicVariationMetrics {
  bitonicWE: PerformanceMetrics | null;
  bitonicEW: PerformanceMetrics | null;
  bitonicSN: PerformanceMetrics | null;
  bitonicNS: PerformanceMetrics | null;
}

export async function measureAllBitonicVariations(
  pois: Coordinate[],
  poiMetadata?: IPoiData[]
): Promise<BitonicVariationMetrics> {
  const bitonicService = new BitonicService();
  const pointCount = pois.length;
  
  // Measure West-East strategy
  const weResult = await measurePerformance(
    () => bitonicService.findBitonicRoute(pois, poiMetadata, 100, SortStrategy.WEST_TO_EAST),
    'Bitonic-WE',
    pointCount
  );
  
  // Measure East-West strategy
  const ewResult = await measurePerformance(
    () => bitonicService.findBitonicRoute(pois, poiMetadata, 100, SortStrategy.EAST_TO_WEST),
    'Bitonic-EW',
    pointCount
  );
  
  // Measure South-North strategy
  const snResult = await measurePerformance(
    () => bitonicService.findBitonicRoute(pois, poiMetadata, 100, SortStrategy.SOUTH_TO_NORTH),
    'Bitonic-SN',
    pointCount
  );
  
  // Measure North-South strategy
  const nsResult = await measurePerformance(
    () => bitonicService.findBitonicRoute(pois, poiMetadata, 100, SortStrategy.NORTH_TO_SOUTH),
    'Bitonic-NS',
    pointCount
  );
  
  return {
    bitonicWE: { 
      ...weResult.metrics,
      clientTotalTime: 0,  // This will be set by the calling code
      strategy: 'WEST_TO_EAST'
    },
    bitonicEW: { 
      ...ewResult.metrics,
      clientTotalTime: 0,
      strategy: 'EAST_TO_WEST'
    },
    bitonicSN: { 
      ...snResult.metrics,
      clientTotalTime: 0,
      strategy: 'SOUTH_TO_NORTH'
    },
    bitonicNS: { 
      ...nsResult.metrics,
      clientTotalTime: 0,
      strategy: 'NORTH_TO_SOUTH'
    }
  };
}

// Return best strategy based on execution time
export function getBestBitonicStrategy(metrics: BitonicVariationMetrics): SortStrategy {
  const strategies = [
    { strategy: SortStrategy.WEST_TO_EAST, time: metrics.bitonicWE?.executionTimeMs },
    { strategy: SortStrategy.EAST_TO_WEST, time: metrics.bitonicEW?.executionTimeMs },
    { strategy: SortStrategy.SOUTH_TO_NORTH, time: metrics.bitonicSN?.executionTimeMs },
    { strategy: SortStrategy.NORTH_TO_SOUTH, time: metrics.bitonicNS?.executionTimeMs }
  ].filter(s => s.time !== undefined);
  
  if (strategies.length === 0) {
    return SortStrategy.WEST_TO_EAST; // Default if no data
  }
  
  // Sort by execution time (fastest first)
  strategies.sort((a, b) => (a.time || Infinity) - (b.time || Infinity));
  return strategies[0].strategy;
}