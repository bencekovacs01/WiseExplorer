import Coordinate from './Coordinate';

export interface PoiRequestBody {
  start: Coordinate;
  end: Coordinate;
  buffer?: number;
  categoryIds?: number[];
  categoryGroupIds?: number[];
}
