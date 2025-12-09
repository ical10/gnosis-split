import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { verifyMessage, getAddress } from 'viem';
import jwt from 'jsonwebtoken';
import { SUPABASE_JWT_SECRET } from '$env/static/private';

const TIMESTAMP_TOLERANCE_MS = 5 * 60 * 1000; // 5 minutes
const EXPECTED_MESSAGE_PREFIX = 'Sign in to Gnosis Split';

function validateMessage(message: string, requestTimestamp: number | string): { valid: boolean; extractedTimestamp?: number; error?: string } {
	if (!message.includes(EXPECTED_MESSAGE_PREFIX)) {
		return { valid: false, error: 'Invalid message format' };
	}

	const timestampMatch = message.match(/Timestamp:\s*(\d+)/);
	if (!timestampMatch || !timestampMatch[1]) {
		return { valid: false, error: 'Missing timestamp in message' };
	}

	const extractedTimestamp = parseInt(timestampMatch[1], 10);
	if (isNaN(extractedTimestamp)) {
		return { valid: false, error: 'Invalid timestamp format in message' };
	}

	const requestTs = typeof requestTimestamp === 'number' ? requestTimestamp : parseInt(requestTimestamp as string, 10);
	if (extractedTimestamp !== requestTs) {
		return { valid: false, error: 'Timestamp mismatch between message and request' };
	}

	const now = Date.now();
	const timeDiff = now - extractedTimestamp;
	if (timeDiff > TIMESTAMP_TOLERANCE_MS || timeDiff < 0) {
		return { valid: false, error: 'Message timestamp too old or invalid' };
	}

	return { valid: true, extractedTimestamp };
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		if (!SUPABASE_JWT_SECRET) {
			return json({ error: 'Server misconfigured' }, { status: 500 });
		}

		const { message, signature, address, timestamp } = await request.json();

		const messageValidation = validateMessage(message, timestamp);
		if (!messageValidation.valid) {
			return json({ error: messageValidation.error }, { status: 400 });
		}

		const isValidSignature = await verifyMessage({
			address,
			message,
			signature
		});

		if (!isValidSignature) {
			return json({ error: 'Invalid signature' }, { status: 401 });
		}

		const checksumAddress = getAddress(address);

		const token = jwt.sign(
			{
				sub: checksumAddress,
				user_metadata: {
					address: checksumAddress
				}
			},
			SUPABASE_JWT_SECRET,
			{
				expiresIn: '1d',
				algorithm: 'HS256'
			}
		);

		return json({ token }, { status: 200 });
	} catch (error) {
		return json({ error: 'Sign-in failed' }, { status: 400 });
	}
};
