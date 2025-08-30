import Coordinate from '../models/Coordinate';
import Route from '../models/Route';
import axios from 'axios';

// OpenRouteService API key and matrix URL
const ORS_KEY: string = process.env.ORS_KEY as string;
const MATRIX_BASE_URL: string =
  'https://api.openrouteservice.org/v2/matrix/driving-car';

/**
 * Gets the distance and duration matrices for a set of coordinates using OpenRouteService API.
 * @param coordinates Array of coordinates to calculate matrices for
 * @returns An object containing distance and duration matrices
 */
export async function getRouteMatrices(coordinates: Coordinate[]): Promise<{
  distanceMatrix: number[][];
  durationMatrix: number[][];
}> {
  if (coordinates.length < 2) {
    throw new Error(
      'At least two coordinates are required for matrix calculation',
    );
  }

  const payloadCoords = coordinates.map((coord) => [
    coord.longitude,
    coord.latitude,
  ]);

  const jsonContent = {
    locations: payloadCoords,
    metrics: ['distance', 'duration'],
  };

  try {
    const response = await axios.post(MATRIX_BASE_URL, jsonContent, {
      headers: {
        Authorization: ORS_KEY,
        'Content-Type': 'application/json',
        Accept: 'application/json, application/geo+json, application/gpx+xml',
      },
    });

    return {
      distanceMatrix: response.data.distances,
      durationMatrix: response.data.durations,
    };
  } catch (error: any) {
    console.error('Matrix_error:', error?.response?.data || error);
    throw new Error(
      `Failed to fetch route matrices: ${error?.response?.data || error}`,
    );
  }
}

/**
 * Calculate distance between two points using the Haversine formula
 * @param lat1 Latitude of the first point
 * @param lon1 Longitude of the first point
 * @param lat2 Latitude of the second point
 * @param lon2 Longitude of the second point
 * @returns Distance in meters
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // distance in meters
}

/**
 * Calculates the distance between two coordinates
 * @param coord1 The first coordinate
 * @param coord2 The second coordinate
 * @returns Distance in meters
 */
export function calculateDistance(
  coord1: Coordinate,
  coord2: Coordinate,
): number {
  return calculateHaversineDistance(
    coord1.latitude,
    coord1.longitude,
    coord2.latitude,
    coord2.longitude,
  );
}

/**
 * Calculates a route metric (distance or duration) based on the given matrix
 * @param route An array of coordinates representing the route
 * @param matrix The matrix (distance or duration) to use for calculation
 * @param coordToIndex Optional mapping from coordinate key to matrix index
 * @returns The total metric value for the route
 */
export function calculateRouteMetric(
  route: Coordinate[],
  matrix: number[][],
  coordToIndex?: Map<string, number>,
): number {
  let total = 0;

  // If no mapping provided, assume indices match the route array indices
  if (!coordToIndex) {
    for (let i = 0; i < route.length - 1; i++) {
      total += matrix[i][i + 1];
    }
    return total;
  }

  // Use the mapping to find indices in the matrix
  for (let i = 0; i < route.length - 1; i++) {
    const fromCoord = route[i];
    const toCoord = route[i + 1];

    const fromKey = `${fromCoord.latitude},${fromCoord.longitude}`;
    const toKey = `${toCoord.latitude},${toCoord.longitude}`;

    const fromIndex = coordToIndex.get(fromKey);
    const toIndex = coordToIndex.get(toKey);

    if (fromIndex !== undefined && toIndex !== undefined) {
      total += matrix[fromIndex][toIndex];
    }
  }

  return total;
}

/**
 * Expands a clustered route back to include all original POIs for display
 * @param clusteredRoute The route using clustered POIs
 * @param clusteredMetadata Metadata about which original POIs are in each cluster
 * @param originalPois Original array of POIs before clustering
 * @param usePointMatching If true, matches points by coordinates instead of assuming indices align
 * @returns A new route with all original POIs but preserving the optimal order
 */
export function expandClusteredRoute(
  clusteredRoute: Route,
  clusteredMetadata: Array<{
    category?: string | null;
    subCategory?: string | null;
    clusteredIds: number[];
  }>,
  originalPois: Coordinate[],
  usePointMatching: boolean = false,
): Route {
  if (!clusteredRoute) return clusteredRoute;

  // Create a mapping to reconstruct the full route with all POIs
  const expandedPoints: Coordinate[] = [];
  const visitedOriginalIndices = new Set<number>();

  // For each point in the clustered route
  for (let i = 0; i < clusteredRoute.points.length; i++) {
    let metadata;

    if (usePointMatching) {
      // BitonicService style matching using coordinates
      const point = clusteredRoute.points[i];
      metadata = clusteredMetadata.find((meta) =>
        meta.clusteredIds.some((id) => {
          const origPoi = originalPois[id];
          return (
            origPoi.latitude === point.latitude &&
            origPoi.longitude === point.longitude
          );
        }),
      );
    } else {
      // BacktrackingService & BranchAndBoundService style using index
      metadata = clusteredMetadata[i];
    }

    // Add all POIs from this cluster
    if (metadata && metadata.clusteredIds) {
      for (const origIndex of metadata.clusteredIds) {
        if (!visitedOriginalIndices.has(origIndex)) {
          expandedPoints.push(originalPois[origIndex]);
          visitedOriginalIndices.add(origIndex);
        }
      }
    }
  }

  // Create a new route with all original POIs but preserving the optimal order
  const expandedRoute = new Route(
    expandedPoints,
    clusteredRoute.totalDistance,
    clusteredRoute.duration,
    clusteredRoute.visitTime,
    clusteredRoute.totalTime,
  );

  // Store the clustering information for the frontend
  expandedRoute.clusterInfo = clusteredMetadata;

  return expandedRoute;
}
