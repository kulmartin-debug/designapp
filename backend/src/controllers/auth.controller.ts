import type { Request, Response } from 'express';
import {
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
  checkPassword,
  createSessionCookieValue,
  isAuthRequired,
  isSessionCookieValid,
} from '../services/auth.service.js';
import { ApiError } from '../types/errors.js';

export function status(req: Request, res: Response) {
  const authRequired = isAuthRequired();
  const cookieValue = (req.cookies as Record<string, string> | undefined)?.[SESSION_COOKIE_NAME];
  const authenticated = !authRequired || isSessionCookieValid(cookieValue);
  res.json({ authRequired, authenticated });
}

export function login(req: Request, res: Response) {
  if (!isAuthRequired()) {
    throw ApiError.invalidInput('Prihlasovanie nie je nakonfigurované (ACCESS_PASSWORD nie je nastavené).');
  }
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  if (!checkPassword(password)) {
    throw ApiError.unauthorized('Nesprávne heslo.');
  }
  res.cookie(SESSION_COOKIE_NAME, createSessionCookieValue(), SESSION_COOKIE_OPTIONS);
  res.json({ ok: true });
}

export function logout(_req: Request, res: Response) {
  res.clearCookie(SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS);
  res.json({ ok: true });
}
