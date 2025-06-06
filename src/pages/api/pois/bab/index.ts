import { NextApiRequest, NextApiResponse } from 'next';
import Coordinate from '@/src/models/Coordinate';
import { IPoiData } from '@/src/models/models';
import { measurePerformance } from '@/src/utils/measurePerformance';
import BranchAndBoundService from '@/src/services/BranchAndBoundService';

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
        const maxClusterDistance: number = req.body?.maxClusterDistance || 100;

        if (!pois || !poiMetadata) {
            return res.status(400).json({
                error: 'Please provide the pois and poi metadata.',
            });
        }

        const babService = new BranchAndBoundService();

        const { result: route, metrics } = await measurePerformance(
            () =>
                babService.findMinimumDistanceRoute(
                    pois,
                    poiMetadata,
                    maxClusterDistance,
                ),
            `BranchAndBound`,
            pois.length,
        );        console.log(`BranchAndBound execution metrics:`, metrics);
        console.log('route', route);
        
        // Add additional properties to metrics that are expected by the frontend
        // This ensures consistent format with other algorithms
        metrics.algorithm = 'branchAndBound';
        
        return res.status(200).json({
            route,
            metrics,
        });
    } catch (error: any) {
        console.error('Error in bitonic-time endpoint:', error);
        return res.status(500).json({
            message: error.message,
            stack:
                process.env.NODE_ENV === 'development'
                    ? error.stack
                    : undefined,
        });
    }
}
