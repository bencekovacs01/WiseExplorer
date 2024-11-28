import { createWithEqualityFn } from 'zustand/traditional';
import { orsApi, ewApi } from '@/src/utils/apiWrapper';
import Coordinate from '@/src/models/Coordinate';
import { greedyPois, PoiUrl } from '../constants/constants';
import { PoiRequestBody } from '../models/PoiRequestBody';

interface POIState {
    pois: Coordinate[];
    categories: Record<string, any>;
    loading: boolean;
    error: string | null;
    findRouteGreedy: (pois: Coordinate[]) => Promise<void>;
    fetchPois: (payload: PoiRequestBody) => Promise<any>;
}

const usePOIStore = createWithEqualityFn<POIState>((set) => ({
    pois: greedyPois,
    categories: {},
    loading: false,
    error: null,
    findRouteGreedy: async (pois: Coordinate[]) => findRouteGreedy(set, pois),
    fetchPois: async (payload) => fetchPois(set, payload),
}));

const findRouteGreedy = async (set: Function, pois: Coordinate[]) => {
    set({ loading: true, error: null });
    try {
        const response = await ewApi.post<{
            route: Coordinate[];
            totalDistance: number;
        }>(PoiUrl.findRouteGreedy, pois);
        set({ pois: response.route, loading: false });
    } catch (error: any) {
        set({
            error: error.message || 'Failed to fetch POIs',
            loading: false,
        });
    }
};

const fetchPois = async (
    set: Function,
    payload: PoiRequestBody,
): Promise<any> => {
    set({ loading: true, error: null });
    try {
        const pois = await ewApi.post<PoiRequestBody>(PoiUrl.pois, payload);
        console.log('pois', pois);

        set({ pois, loading: false });
        return pois;
    } catch (error: any) {
        set({
            error: error.message || 'Failed to fetch pois',
            loading: false,
        });
        throw error;
    }
};

export default usePOIStore;
