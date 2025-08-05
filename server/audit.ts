import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';

export interface AuditLog {
  id?: number;
  userId: number;
  username: string;
  action: string;
  resource: string;
  resourceId?: string | number;
  details: any;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  status: 'success' | 'failure' | 'error';
}

// Audit logging middleware
export const auditLog = (action: string, resource: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const originalSend = res.send;
    const originalJson = res.json;
    
    // Capture response
    res.send = function(data: any) {
      logAuditEvent(req, res, action, resource, startTime, data);
      return originalSend.call(this, data);
    };
    
    res.json = function(data: any) {
      logAuditEvent(req, res, action, resource, startTime, data);
      return originalJson.call(this, data);
    };
    
    next();
  };
};

// Log audit event
async function logAuditEvent(
  req: Request, 
  res: Response, 
  action: string, 
  resource: string, 
  startTime: number,
  responseData?: any
) {
  try {
    if (!req.isAuthenticated()) return;
    
    const user = req.user as any;
    const duration = Date.now() - startTime;
    
    const auditEntry: Omit<AuditLog, 'id'> = {
      userId: user.id,
      username: user.username,
      action,
      resource,
      resourceId: req.params.id || req.body.id,
      details: {
        method: req.method,
        path: req.path,
        query: req.query,
        body: sanitizeRequestBody(req.body),
        responseStatus: res.statusCode,
        responseSize: JSON.stringify(responseData).length,
        duration,
        userAgent: req.get('User-Agent') || 'Unknown',
      },
      ipAddress: req.ip || req.connection.remoteAddress || 'Unknown',
      userAgent: req.get('User-Agent') || 'Unknown',
      timestamp: new Date(),
      status: res.statusCode < 400 ? 'success' : res.statusCode < 500 ? 'failure' : 'error',
    };
    
    // Store in database (you'll need to create an audit_logs table)
    await storage.createAuditLog(auditEntry);
    
    // Console log for immediate visibility - removed for security
    // console.log(`🔍 AUDIT: ${user.username} ${action} ${resource} - ${auditEntry.status} (${duration}ms)`);
    
  } catch (error) {
    console.error('Audit logging failed:', error);
  }
}

// Sanitize request body for logging (remove sensitive data)
function sanitizeRequestBody(body: any): any {
  if (!body) return body;
  
  const sanitized = { ...body };
  const sensitiveFields = ['password', 'token', 'secret', 'key'];
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  return sanitized;
}

// Security event logging
export const logSecurityEvent = (event: string, details: any, req: Request) => {
  const securityLog = {
    event,
    details,
    timestamp: new Date(),
    ipAddress: req.ip || req.connection.remoteAddress || 'Unknown',
    userAgent: req.get('User-Agent') || 'Unknown',
    user: req.isAuthenticated() ? (req.user as any)?.username : 'Anonymous',
  };
  
  console.warn(`🚨 SECURITY: ${event}`, securityLog);
  
  // In production, send to security monitoring service
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to security monitoring service
  }
}; 