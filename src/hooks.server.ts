import { SUPABASE_JWT_SECRET } from '$env/static/private';
import type { Handle } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';

export const handle: Handle = async ({ event, resolve }) => {
  const authHeader = event.request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (token) {
    try {
      const decodedPayload = jwt.verify(token, SUPABASE_JWT_SECRET, { algorithms: ['HS256'] }) as any;
      event.locals.user = decodedPayload;
    } catch (error) {
      event.locals.user = null;
    }
  } else {
    event.locals.user = null;
  }

  return resolve(event);
};
