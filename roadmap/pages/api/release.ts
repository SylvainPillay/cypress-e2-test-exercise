import type { NextApiRequest, NextApiResponse } from 'next'

import redis from '../../lib/redis'

export default async function released(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.body

    const entry = JSON.parse((await redis.hget('features', id)) || 'null')
    const updated = {
      ...entry,
      released: true,
    }

    await redis.hset('features', id, JSON.stringify(updated))
    return res.status(201).json(updated)
}