import { Request, Response, NextFunction } from 'express';
import { randomBytes } from 'crypto';

// CSRF token generation
export const generateCSRFToken = () => {
  return randomBytes(32).toString('hex');
};

// CSRF protection middleware
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  // Skip CSRF check for GET requests and API endpoints that don't modify data
  if (req.method === 'GET' || req.path.startsWith('/api/user')) {
    return next();
  }

  const csrfToken = req.headers['x-csrf-token'] || req.headers['csrf-token'];
  const sessionToken = (req.session as any)?.csrfToken;

  if (!csrfToken || !sessionToken || csrfToken !== sessionToken) {
    return res.status(403).json({ 
      message: 'CSRF token validation failed',
      error: 'INVALID_CSRF_TOKEN'
    });
  }

  next();
};

// CSRF token middleware for session
export const csrfTokenMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (req.session && !(req.session as any).csrfToken) {
    (req.session as any).csrfToken = generateCSRFToken();
  }
  next();
}; 