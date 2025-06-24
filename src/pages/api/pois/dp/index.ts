import { NextApiRequest, NextApiResponse } from 'next';
import Coordinate from '@/src/models/Coordinate';
import { IPoiData } from '@/src/models/models';
import { measurePerformance } from '@/src/utils/measurePerformance';
import DynamicProgrammingService from '@/src/services/DynamicProgrammingService';

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

        const dpService = new DynamicProgrammingService();

        const { result: route, metrics } = await measurePerformance(
            () =>
                dpService.findMinimumTimeRoute(
                    pois,
                    poiMetadata,
                    maxClusterDistance,
                ),
            `DynamicProgramming`,
            pois.length,
        );
        metrics.algorithm = 'dynamicProgramming';

        return res.status(200).json({
            route,
            metrics,
        });
    } catch (error: any) {
        console.error('Error in dynamic-programming endpoint:', error);
        return res.status(500).json({
            message: error.message,
            stack:
                process.env.NODE_ENV === 'development'
                    ? error.stack
                    : undefined,
        });
    }
}
