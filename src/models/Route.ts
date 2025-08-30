import Coordinate from './Coordinate';

export default class Route {
  points: Coordinate[];
  totalDistance: number;
  duration?: number;
  visitTime?: number;
  totalTime?: number;
  clusterInfo?: Array<{
    category?: string | null;
    subCategory?: string | null;
    clusteredIds: number[];
  }>;

  constructor(
    points: Coordinate[],
    totalDistance: number,
    duration?: number,
    visitTime?: number,
    totalTime?: number,
  ) {
    this.points = points;
    this.totalDistance = totalDistance;
    this.duration = duration;
    this.visitTime = visitTime;
    this.totalTime = totalTime;
  }
}
