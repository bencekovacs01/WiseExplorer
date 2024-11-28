import { NextApiRequest, NextApiResponse } from 'next';
import Coordinate from '@/src/models/Coordinate';
import { POIService } from '@/src/services/POIService';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const start: Coordinate = req.body?.start;
        const end: Coordinate = req.body?.end;
        const buffer: number = req.body?.buffer;

        if (!start || !end) {
            return res.status(400).json({
                error: 'Please provide the start and end points.',
            });
        }

        const poiService: POIService = new POIService();
        const standardPois = await poiService.getPOIsStandard(
            start,
            end,
            buffer,
        );
        res.json(JSON.parse(standardPois));

        // res.json({ message: 'Success' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}
