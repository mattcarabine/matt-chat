import { Hono } from 'hono';
import Ably from 'ably';
import { auth } from '../auth';

export const ablyRoutes = new Hono();

// Generate Ably token for authenticated users
ablyRoutes.get('/token', async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  // Read at request time to ensure env is loaded
  const ablyApiKey = process.env.ABLY_API_KEY;
  if (!ablyApiKey) {
    console.error('ABLY_API_KEY environment variable is not set');
    return c.json({ error: 'Ably not configured' }, 500);
  }

  const userId = session.user.id;

  try {
    const ably = new Ably.Rest({ key: ablyApiKey });
    const tokenRequest = await ably.auth.createTokenRequest({
      clientId: userId,
      capability: {
        '*': ['publish', 'subscribe', 'presence', 'history'],
      },
    });

    return c.json({ tokenRequest });
  } catch (error) {
    console.error('Failed to create Ably token:', error);
    return c.json({ error: 'Failed to create token' }, 500);
  }
});
