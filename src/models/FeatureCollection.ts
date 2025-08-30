export interface FeatureCollection {
  type: string;
  features: Array<Feature>;
}

export interface Feature {
  type: string;
  geometry: Geometry;
  properties: any;
}

export interface Geometry {
  type: string;
  coordinates: [number, number];
}
