import { NextApiRequest, NextApiResponse } from 'next';
import Coordinate from '@/src/models/Coordinate';
import GreedyService from '@/src/services/GreedyService';
import { IPoiData } from '@/src/models/models';
import { measurePerformance } from '@/src/utils/measurePerformance'; 

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const pois: Coordinate[] = req.body?.pois;
        const poiMetadata: IPoiData[] = req.body?.poiMetadata;

        if (!pois || !poiMetadata) {
            return res.status(400).json({
                error: 'Please provide the pois and poi metadata.',
            });
        }

        const greedyService = new GreedyService();
        
        const { result: routes, metrics } = await measurePerformance(
            () => greedyService.findMinimumDistanceRoute(pois, poiMetadata),
            'greedy',
            pois.length
        );
        
        const route = routes[0]; // Get the first (and only) route
        
        return res.status(200).json({
            route,
            metrics
        });
    } catch (error: any) {
        return res.status(500).json({ message: error.message });
    }
}
