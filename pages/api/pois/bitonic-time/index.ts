import { NextApiRequest, NextApiResponse } from 'next';
import Coordinate from '@/src/models/Coordinate';
import BitonicService, { SortStrategy } from '@/src/services/BitonicService';
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
        const strategy: SortStrategy =
            req.body?.strategy || SortStrategy.WEST_TO_EAST;
        const maxClusterDistance: number = req.body?.maxClusterDistance || 100;

        if (!pois || !poiMetadata) {
            return res.status(400).json({
                error: 'Please provide the pois and poi metadata.',
            });
        }

        const bitonicService = new BitonicService();

        const { result: route, metrics } = await measurePerformance(
            () =>
                bitonicService.findBitonicRoute(
                    pois,
                    poiMetadata,
                    maxClusterDistance,
                    strategy,
                ),
            `Bitonic-${strategy}`,
            pois.length,
        );

        return res.status(200).json({
            route,
            metrics: {
                ...metrics,
                strategy: strategy,
            },
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
