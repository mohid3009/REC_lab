import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import { UserRole } from '../models/User';

// Extend Express Session to include user data
declare module 'express-session' {
    interface SessionData {
        userId?: string;
        email?: string;
        role?: UserRole;
        name?: string;
    }
}

export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: UserRole;
        name: string;
    };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        // Check if user is logged in via session
        if (!req.session.userId) {
            return res.status(401).json({ message: 'Not authenticated. Please log in.' });
        }

        // Verify user still exists in database
        const user = await User.findById(req.session.userId);
        if (!user) {
            req.session.destroy(() => { });
            return res.status(401).json({ message: 'User not found' });
        }

        // Attach user info to request
        req.user = {
            id: user._id.toString(),
            email: user.email,
            role: user.role,
            name: user.name
        };

        next();
    } catch (error) {
        res.status(401).json({ message: 'Authentication failed' });
    }
};

export const requireRole = (...roles: UserRole[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `Access denied. Required role: ${roles.join(' or ')}`
            });
        }

        next();
    };
};

// Helper to get user from request
export const getCurrentUser = (req: AuthRequest) => {
    return req.user;
};
