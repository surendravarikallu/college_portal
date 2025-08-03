import { Request, Response, NextFunction } from 'express';

// Define permissions
export const Permissions = {
  // Admin Management
  MANAGE_ADMINS: 'manage_admins',
  VIEW_ADMINS: 'view_admins',
  
  // Student Management
  MANAGE_STUDENTS: 'manage_students',
  VIEW_STUDENTS: 'view_students',
  EXPORT_STUDENTS: 'export_students',
  IMPORT_STUDENTS: 'import_students',
  
  // Event Management
  MANAGE_EVENTS: 'manage_events',
  VIEW_EVENTS: 'view_events',
  
  // Alumni Management
  MANAGE_ALUMNI: 'manage_alumni',
  VIEW_ALUMNI: 'view_alumni',
  
  // News Management
  MANAGE_NEWS: 'manage_news',
  VIEW_NEWS: 'view_news',
  
  // Notifications
  MANAGE_NOTIFICATIONS: 'manage_notifications',
  VIEW_NOTIFICATIONS: 'view_notifications',
  
  // System
  VIEW_DASHBOARD: 'view_dashboard',
  MANAGE_SYSTEM: 'manage_system',
  VIEW_LOGS: 'view_logs',
} as const;

// Define roles and their permissions
export const RolePermissions = {
  'tpo': [
    Permissions.VIEW_DASHBOARD,
    Permissions.MANAGE_STUDENTS,
    Permissions.VIEW_STUDENTS,
    Permissions.EXPORT_STUDENTS,
    Permissions.IMPORT_STUDENTS,
    Permissions.MANAGE_EVENTS,
    Permissions.VIEW_EVENTS,
    Permissions.MANAGE_ALUMNI,
    Permissions.VIEW_ALUMNI,
    Permissions.MANAGE_NEWS,
    Permissions.VIEW_NEWS,
    Permissions.MANAGE_NOTIFICATIONS,
    Permissions.VIEW_NOTIFICATIONS,
    Permissions.MANAGE_ADMINS, // Allow TPO to manage admins
    Permissions.VIEW_ADMINS,   // Allow TPO to view admins
  ],
  'admin': [
    ...Object.values(Permissions), // All permissions
  ],
} as const;

// Check if user has permission
export const hasPermission = (userRole: string, permission: string): boolean => {
  const permissions = RolePermissions[userRole as keyof typeof RolePermissions];
  return permissions ? permissions.includes(permission as any) : false;
};

// RBAC middleware
export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = req.user as any;
    if (!user || !user.role) {
      return res.status(403).json({ message: 'Invalid user role' });
    }

    if (!hasPermission(user.role, permission)) {
      return res.status(403).json({ 
        message: 'Insufficient permissions',
        error: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    next();
  };
};

// Role-based route protection
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = req.user as any;
    if (!user || !user.role) {
      return res.status(403).json({ message: 'Invalid user role' });
    }

    if (!roles.includes(user.role)) {
      return res.status(403).json({ 
        message: 'Access denied for this role',
        error: 'INSUFFICIENT_ROLE'
      });
    }

    next();
  };
}; 