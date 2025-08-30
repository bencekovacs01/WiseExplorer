import { NextApiRequest, NextApiResponse } from 'next';
import Coordinate from '@/src/models/Coordinate';
import { BacktrackingService } from '@/src/services/BacktrackingService';

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

    res.json({});

    // const backtrackingService = new BacktrackingService();
    // const route = await backtrackingService.findMinimumDistanceRouteBt(
    //     start,
    //     end,
    //     buffer,
    // );
    // res.json(route);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}
