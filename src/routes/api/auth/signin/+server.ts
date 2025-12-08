import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { verifyMessage } from 'viem';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.SUPABASE_JWT_SECRET;
const TIMESTAMP_TOLERANCE_MS = 5 * 60 * 1000; // 5 minutes

export const POST: RequestHandler = async ({ request }) => {
	try {
		if (!JWT_SECRET) {
			return json({ error: 'Server misconfigured' }, { status: 500 });
		}

		const { message, signature, address, timestamp } = await request.json();

		const now = Date.now();
		const messageTimestamp = typeof timestamp === 'number' ? timestamp : parseInt(timestamp);
		const timeDiff = now - messageTimestamp;

		if (timeDiff > TIMESTAMP_TOLERANCE_MS || timeDiff < 0) {
			return json({ error: 'Message timestamp too old or invalid' }, { status: 401 });
		}

		const isValidSignature = await verifyMessage({
			address,
			message,
			signature
		});

		if (!isValidSignature) {
			return json({ error: 'Invalid signature' }, { status: 401 });
		}

		const token = jwt.sign(
			{
				sub: address,
				user_metadata: {
					address: address.toLowerCase()
				}
			},
			JWT_SECRET,
			{
				expiresIn: '1d',
				algorithm: 'HS256'
			}
		);

		return json({ token }, { status: 200 });
	} catch (error) {
		console.error('Sign-in error:', error);
		return json({ error: 'Sign-in failed' }, { status: 400 });
	}
};
