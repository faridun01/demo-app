import cors, { CorsOptions } from 'cors';
import type { NextFunction, Request, Response } from 'express';
import { securityConfig } from '../config/security.js';

const normalizeOrigin = (value: string) => value.trim().replace(/\/+$/, '');

type CorsRequestLike = Pick<Request, 'headers'> & { protocol?: string };

const getRequestOrigins = (req: CorsRequestLike) => {
  const forwardedHost = String(req.headers['x-forwarded-host'] || '')
    .split(',')[0]
    .trim();
  const host = forwardedHost || String(req.headers.host || '').trim();
  const forwardedProto = String(req.headers['x-forwarded-proto'] || '')
    .split(',')[0]
    .trim()
    .toLowerCase();
  const protocol = forwardedProto || req.protocol || 'http';

  if (!host) {
    return [];
  }

  return [`${protocol}://${host}`, `http://${host}`, `https://${host}`].map(normalizeOrigin);
};

export const corsMiddleware = cors((req, callback) => {
  const allowedOrigins = new Set([
    ...securityConfig.cors.origins.map(normalizeOrigin),
    ...getRequestOrigins(req),
  ]);

  const origin = String(req.headers.origin || '').trim();
  const allowOrigin = !origin || allowedOrigins.has(normalizeOrigin(origin));

  const options: CorsOptions = {
    origin: allowOrigin,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type'],
    credentials: true,
    maxAge: 86400,
  };

  callback(allowOrigin ? null : new Error('Origin not allowed by CORS'), options);
});

export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  next();
};
