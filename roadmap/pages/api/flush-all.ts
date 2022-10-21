import type { NextApiRequest, NextApiResponse } from 'next'
import { v4 as uuidv4 } from 'uuid'

import redis from '../../lib/redis'

export default async function flushAll(
    req: NextApiRequest,
    res: NextApiResponse
)
{
    await redis.flushall();
    res.status(200).json({
        body: 'success',
    });
}



