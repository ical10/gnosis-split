import type { Card, Transaction } from './types';

const MOCK_MODE = import.meta.env.VITE_MOCK_GNOSIS_PAY !== 'false';

const delay = () => new Promise((resolve) => setTimeout(resolve, 200 + Math.random() * 600));

const mockCards: Card[] = [
	{
		id: 'crd_mock_1',
		last4Digits: '4242',
		status: 'ACTIVE',
		type: 'VIRTUAL',
		expiryMonth: 12,
		expiryYear: 2027,
		cardholderName: 'John Doe'
	},
	{
		id: 'crd_mock_2',
		last4Digits: '8888',
		status: 'ACTIVE',
		type: 'PHYSICAL',
		expiryMonth: 6,
		expiryYear: 2028,
		cardholderName: 'John Doe'
	}
];

const generateMockTransactions = (): Transaction[] => {
	const merchants = [
		{ name: 'Starbucks', city: 'Berlin', country: 'Germany' },
		{ name: 'Uber', city: 'Barcelona', country: 'Spain' },
		{ name: 'Amazon.de', city: undefined, country: 'Germany' },
		{ name: 'Spotify', city: undefined, country: 'Sweden' },
		{ name: 'Restaurant Marisqueria', city: 'Lisbon', country: 'Portugal' },
		{ name: 'Netflix', city: undefined, country: 'USA' },
		{ name: 'Lidl', city: 'Berlin', country: 'Germany' },
		{ name: 'Burger King', city: 'Barcelona', country: 'Spain' },
		{ name: 'Apple Store', city: undefined, country: 'USA' },
		{ name: 'Zara', city: 'Madrid', country: 'Spain' },
		{ name: 'H&M', city: 'Berlin', country: 'Germany' },
		{ name: 'Media Markt', city: 'Munich', country: 'Germany' },
		{ name: 'Cervejaria Ramiro', city: 'Lisbon', country: 'Portugal' },
		{ name: 'OpenAI', city: undefined, country: 'USA' },
		{ name: 'Rewe', city: 'Berlin', country: 'Germany' }
	];

	const transactions: Transaction[] = [];
	const now = new Date();

	for (let i = 0; i < 20; i++) {
		const daysAgo = Math.floor(Math.random() * 30);
		const date = new Date(now);
		date.setDate(date.getDate() - daysAgo);

		const merchant = merchants[Math.floor(Math.random() * merchants.length)];
		const amount = -(Math.floor(Math.random() * 15000) + 500);
		const cashback = Math.random() > 0.7 ? Math.floor(Math.abs(amount) * 0.01) : 0;
		const cardId = Math.random() > 0.5 ? 'crd_mock_1' : 'crd_mock_2';

		transactions.push({
			id: `tx_mock_${i + 1}`,
			cardId,
			type: 'CARD_PAYMENT',
			status: Math.random() > 0.1 ? 'SETTLED' : 'PENDING',
			amount: {
				value: amount.toString(),
				currency: 'EUR'
			},
			merchant,
			transactionDate: date.toISOString(),
			settledDate: date.toISOString(),
			cashbackAmount: {
				value: cashback.toString(),
				currency: 'EUR'
			},
			description: merchant.name
		});
	}

	return transactions.sort(
		(a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
	);
};

let cachedTransactions: Transaction[] | null = null;

export async function getCards(): Promise<Card[]> {
	if (MOCK_MODE) {
		await delay();
		return mockCards;
	}
	throw new Error('Real Gnosis Pay API not implemented');
}

export async function getTransactions(cardId?: string): Promise<Transaction[]> {
	if (MOCK_MODE) {
		await delay();

		if (!cachedTransactions) {
			cachedTransactions = generateMockTransactions();
		}

		if (cardId) {
			return cachedTransactions.filter((tx) => tx.cardId === cardId);
		}

		return cachedTransactions;
	}
	throw new Error('Real Gnosis Pay API not implemented');
}

export async function getTransactionById(txId: string): Promise<Transaction | undefined> {
	if (MOCK_MODE) {
		await delay();

		if (!cachedTransactions) {
			cachedTransactions = generateMockTransactions();
		}

		return cachedTransactions.find((tx) => tx.id === txId);
	}
	throw new Error('Real Gnosis Pay API not implemented');
}
