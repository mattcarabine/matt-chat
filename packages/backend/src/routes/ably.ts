import { Hono } from 'hono';
import Ably from 'ably';
import type { AppContext } from '../types';

export const ablyRoutes = new Hono<AppContext>();

ablyRoutes.get('/token', async (c) => {
  const ablyApiKey = process.env.ABLY_API_KEY;
  if (!ablyApiKey) {
    console.error('ABLY_API_KEY environment variable is not set');
    return c.json({ error: 'Ably not configured' }, 500);
  }

  const session = c.get('session');

  try {
    const ably = new Ably.Rest({ key: ablyApiKey });
    const tokenRequest = await ably.auth.createTokenRequest({
      clientId: session.user.id,
      capability: { '*': ['publish', 'subscribe', 'presence', 'history'] },
    });
    return c.json({ tokenRequest });
  } catch (error) {
    console.error('Failed to create Ably token:', error);
    return c.json({ error: 'Failed to create token' }, 500);
  }
});
