import { NextApiRequest, NextApiResponse } from 'next';
import Coordinate from '@/src/models/Coordinate';
import GreedyService from '@/src/services/GreedyService';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const pois: Coordinate[] = req.body;

        if (!pois || pois.length < 2) {
            return res.status(400).json({
                error: 'Please provide at least 2 POIs in the request body.',
            });
        }

        await new Promise((resolve) => setTimeout(resolve, 500));

        res.json([
            {
                route: [
                    {
                        latitude: 24.59888,
                        longitude: 46.52346,
                    },
                    {
                        latitude: 24.59236,
                        longitude: 46.52909,
                    },
                    {
                        latitude: 24.59242,
                        longitude: 46.53456,
                    },
                    // {
                    //     latitude: 24.59888,
                    //     longitude: 46.52346,
                    // },
                ],
                totalDistance: 4933.1,
            },
        ]);

        // const greedyService = new GreedyService();
        // const route = await greedyService.findMinimumDistanceRoute(pois);
        // res.json(route);
    } catch (error: any) {
        console.log('!@#!@##@!#@@#!', error)
        res.status(500).json({ message: error.message });
    }
}
