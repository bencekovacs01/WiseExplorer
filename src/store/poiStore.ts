import { createWithEqualityFn } from 'zustand/traditional';
import { orsApi, ewApi } from '@/src/utils/apiWrapper';
import Coordinate from '@/src/models/Coordinate';
import { PoiUrl } from '../constants/constants';
import { PoiRequestBody } from '../models/PoiRequestBody';

import categories from '../components/CategorySelector/categories.json';

interface POIState {
  categories: Record<string, any>;
  loading: boolean;
  error: string | null;
  findRouteGreedy: (pois: Coordinate[]) => Promise<void>;
  fetchPois: (payload: PoiRequestBody) => Promise<any>;
  fetchCategories: () => Promise<void>;
  search: (text: string) => Promise<void>;
  loadDistanceMatrix: (pois: Coordinate[]) => Promise<void>;
}

const usePOIStore = createWithEqualityFn<POIState>((set) => ({
  categories: categories,
  loading: false,
  error: null,
  findRouteGreedy: async (pois: Coordinate[]) => findRouteGreedy(pois, set),
  fetchPois: async (payload) => fetchPois(payload, set),
  fetchCategories: async () => fetchCategories(set),
  search: async (text: string) => search(text, set),
  loadDistanceMatrix: async (pois: Coordinate[]) =>
    loadDistanceMatrix(pois, set),
}));

const findRouteGreedy = async (
  pois: Coordinate[],
  set: Function,
): Promise<any> => {
  set({ loading: true, error: null });
  try {
    const response = await ewApi.post<{
      route: Coordinate[];
      totalDistance: number;
    }>(PoiUrl.findRouteGreedy, pois);

    set({ loading: false });
    return response;
  } catch (error: any) {
    set({
      error: error.message || 'Failed to fetch POIs',
      loading: false,
    });
  }
};

const fetchPois = async (
  payload: PoiRequestBody,
  set: Function,
): Promise<any> => {
  set({ loading: true, error: null });
  try {
    const pois = await ewApi.post<PoiRequestBody>(PoiUrl.pois, payload);

    set({ loading: false });
    return pois;
  } catch (error: any) {
    set({
      error: error.message || 'Failed to fetch pois',
      loading: false,
    });
    throw error;
  }
};

const fetchCategories = async (set: Function): Promise<any> => {
  set({ loading: true, error: null });
  try {
    const categories = await ewApi.get(PoiUrl.categories);
    set({ categories: categories, loading: false });

    return categories;
  } catch (error: any) {
    set({
      error: error.message || 'Failed to fetch categories',
      loading: false,
    });
  }
};

const search = async (text: string, set: Function): Promise<any> => {
  set({ loading: true, error: null });
  try {
    const search = await ewApi.get<any>(PoiUrl.search, {
      text,
    });

    return {
      features: search?.features || [],
    };
  } catch (error: any) {
    set({
      error: error.message || 'Failed to fetch categories',
      loading: false,
    });
  }
};

const loadDistanceMatrix = async (
  pois: Coordinate[],
  set: Function,
): Promise<any> => {
  set({ loading: true, error: null });
  try {
    const payloadPois = pois.map((poi) => [poi.longitude, poi.latitude]);
    const jsonContent = {
      locations: payloadPois,
      metrics: ['distance'],
    };

    const response: any = await orsApi.post(
      PoiUrl.loadDistanceMatrix,
      jsonContent,
    );

    set({ loading: false });
    return response?.distances;
  } catch (error: any) {
    set({
      error: error.message || 'Failed to fetch distance matrix',
      loading: false,
    });
  }
};

export default usePOIStore;
