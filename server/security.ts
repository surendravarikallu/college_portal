import { Express, Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// Input validation middleware
export const validateInput = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          message: 'Invalid input data',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      } else {
        res.status(400).json({ message: 'Invalid input data' });
      }
    }
  };
};

// File upload security middleware
export const validateFileUpload = (req: Request, res: Response, next: NextFunction) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).json({ message: 'No files uploaded' });
  }

  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/csv', 'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  const maxFileSize = 5 * 1024 * 1024; // 5MB

  for (const fieldName in req.files) {
    const files = (req.files as { [fieldname: string]: Express.Multer.File[] })[fieldName];
    
    for (const file of files) {
      // Check file size
      if (file.size > maxFileSize) {
        return res.status(400).json({ 
          message: `File ${file.originalname} is too large. Maximum size is 5MB.` 
        });
      }

      // Check file type
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({ 
          message: `File type ${file.mimetype} is not allowed.` 
        });
      }

      // Check for path traversal
      const fileName = file.originalname;
      if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
        return res.status(400).json({ 
          message: 'Invalid filename detected.' 
        });
      }
    }
  }

  next();
};

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy
  res.setHeader('Permissions-Policy', 
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=()'
  );
  
  // Strict Transport Security (HSTS)
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  
  // Content Security Policy (Enhanced)
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self'; " +
    "connect-src 'self'; " +
    "frame-ancestors 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self'; " +
    "upgrade-insecure-requests;"
  );

  next();
};

// Advanced request validation
export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /vbscript:/i,
    /onload=/i,
    /onerror=/i,
    /eval\(/i,
    /document\./i,
    /window\./i,
  ];
  
  const requestString = JSON.stringify(req.body) + JSON.stringify(req.query) + req.path;
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(requestString)) {
      return res.status(400).json({ 
        message: 'Suspicious request detected',
        error: 'SUSPICIOUS_REQUEST'
      });
    }
  }
  
  next();
};

// IP-based rate limiting for security events
export const securityRateLimit = (req: Request, res: Response, next: NextFunction) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  
  // Track failed attempts per IP
  if (!(global as any).securityAttempts) {
    (global as any).securityAttempts = new Map();
  }
  
  const attempts = (global as any).securityAttempts.get(clientIP) || 0;
  
  if (attempts > 10) {
    return res.status(429).json({ 
      message: 'Too many security violations',
      error: 'SECURITY_VIOLATION_LIMIT'
    });
  }
  
  next();
};

// Error handling middleware
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);

  // Don't expose internal errors in production
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      message: 'Validation error',
      errors: isProduction ? undefined : err.errors 
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Generic error response
  res.status(500).json({ 
    message: isProduction ? 'Internal server error' : err.message 
  });
}; 