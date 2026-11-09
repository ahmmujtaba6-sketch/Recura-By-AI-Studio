import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const ipMap = new Map<string, RateLimitRecord>();

// Clean up stale IPs every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of ipMap.entries()) {
    if (record.resetAt <= now) {
      ipMap.delete(ip);
    }
  }
}, 5 * 60 * 1000);

export function rateLimit(options: { max: number; windowMs: number; message?: string }) {
  const { max, windowMs, message = 'Too many requests. Please try again later.' } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    let record = ipMap.get(ip);
    if (!record || record.resetAt <= now) {
      record = { count: 1, resetAt: now + windowMs };
      ipMap.set(ip, record);
      return next();
    }

    record.count++;
    if (record.count > max) {
      const retryAfter = Math.ceil((record.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfter.toString());
      return res.status(429).json({ error: message, retryAfter });
    }

    next();
  };
}
