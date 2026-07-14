import type { NextFunction, Request, Response } from 'express';
import { SESSION_COOKIE_NAME, isAuthRequired, isSessionCookieValid } from '../services/auth.service.js';
import { ApiError } from '../types/errors.js';

// Guards every /api/* route except /api/auth/* and /api/health (mounted
// separately in app.ts, before this middleware). If ACCESS_PASSWORD is unset,
// the whole gate is a no-op (dev convenience) - see auth.service.ts.
export function authGuard(req: Request, _res: Response, next: NextFunction) {
  if (!isAuthRequired()) {
    next();
    return;
  }
  const cookieValue = (req.cookies as Record<string, string> | undefined)?.[SESSION_COOKIE_NAME];
  if (!isSessionCookieValid(cookieValue)) {
    next(ApiError.unauthorized('Prihláste sa prosím znova.'));
    return;
  }
  next();
}
