export interface Card {
  id: string;
  last4Digits: string;
  status: 'ACTIVE' | 'INACTIVE';
  type: 'VIRTUAL' | 'PHYSICAL';
  expiryMonth: number;
  expiryYear: number;
  cardholderName: string;
}

export interface Transaction {
  id: string;
  cardId: string;
  type: 'CARD_PAYMENT' | 'CARD_REFUND';
  status: 'SETTLED' | 'PENDING';
  amount: {
    value: string;
    currency: string;
  };
  merchant: {
    name: string;
    city?: string;
    country: string;
  };
  transactionDate: string;
  settledDate: string;
  cashbackAmount: {
    value: string;
    currency: string;
  };
  description?: string;
}

export interface Participant {
  address: string;
  name?: string;
  amount: number;
}

export interface Split {
  id: string;
  description: string;
  totalAmount: number;
  date: string;
  payerAddress: string;
  participants: Participant[];
  payments: { address: string; txHash?: string }[];
  sourceTxId?: string;
  createdAt?: string;
}
