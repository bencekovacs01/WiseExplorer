import Coordinate from '../models/Coordinate';
import { IPoiData } from '../models/models';
import { calculateHaversineDistance } from './route.utils';

export function clusterNearbyPOIs(
  pois: Coordinate[],
  maxClusterDistance: number = 100,
  poiMetadata?: IPoiData[],
): {
  clusteredPois: Coordinate[];
  clusteredMetadata: Array<{
    category?: string | null;
    subCategory?: string | null;
    clusteredIds: number[];
  }>;
} {
  // Don't cluster start and end points
  const startPoint = pois[0];
  const endPoint = pois[pois.length - 1];

  // Skip processing if we only have start and end points
  if (pois.length <= 2) {
    return {
      clusteredPois: pois,
      clusteredMetadata:
        poiMetadata?.map((meta, index) => ({
          ...meta,
          clusteredIds: [index],
        })) || [],
    };
  }

  // Get the POIs between start and end
  const poiList = pois.slice(1, pois.length - 1);
  const metadataList = poiMetadata?.slice(1, poiMetadata.length - 1) || [];

  const clusters: number[][] = [];
  const visited = new Set<number>();

  // Create clusters based on proximity
  for (let i = 0; i < poiList.length; i++) {
    if (visited.has(i)) continue;

    const cluster = [i];
    visited.add(i);

    for (let j = 0; j < poiList.length; j++) {
      if (i === j || visited.has(j)) continue;

      // Calculate distance between POIs
      const distance = calculateHaversineDistance(
        poiList[i].latitude,
        poiList[i].longitude,
        poiList[j].latitude,
        poiList[j].longitude,
      );

      if (distance <= maxClusterDistance) {
        cluster.push(j);
        visited.add(j);
      }
    }

    clusters.push(cluster);
  }

  // Create clustered POIs and metadata
  const clusteredPois: Coordinate[] = [startPoint];
  const clusteredMetadata: Array<{
    category?: string | null;
    subCategory?: string | null;
    clusteredIds: number[];
  }> = [{ category: null, subCategory: null, clusteredIds: [0] }];

  for (const cluster of clusters) {
    // Use the first POI in the cluster as the representative point for navigation
    const representativePOI = poiList[cluster[0]];
    clusteredPois.push(representativePOI);

    // Store all POI indices that belong to this cluster (add 1 to account for start point)
    const clusterMetadata = {
      category: metadataList[cluster[0]]?.category || null,
      subCategory: metadataList[cluster[0]]?.subCategory || null,
      clusteredIds: cluster.map((idx) => idx + 1), // Add 1 because we removed the start point
    };
    clusteredMetadata.push(clusterMetadata);
  }

  // Add end point
  clusteredPois.push(endPoint);
  clusteredMetadata.push({
    category: null,
    subCategory: null,
    clusteredIds: [pois.length - 1],
  });

  return { clusteredPois, clusteredMetadata };
}
