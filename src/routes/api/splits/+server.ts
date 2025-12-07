import { json } from '@sveltejs/kit';
import { supabase } from '$lib/server/supabase';
import type { RequestHandler } from '@sveltejs/kit';
import type { Split } from '$lib/types';

export const GET: RequestHandler = async () => {
  try {
    const { data, error } = await supabase
      .from('splits')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return json({ error: 'Failed to fetch splits' }, { status: 500 });
    }

    const splits: Split[] = (data || []).map((row) => ({
      id: row.id,
      description: row.description,
      totalAmount: row.total_amount,
      date: row.date,
      payerAddress: row.payer_address,
      participants: row.participants as unknown as Split['participants'],
      payments: row.payments as unknown as Split['payments'],
      createdAt: row.created_at as unknown as Split['createdAt'],
      sourceTxId: row.source_tx_id || undefined
    }));

    return json(splits);
  } catch (error) {
    console.error('Error fetching splits:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const split = await request.json();

    const { data, error } = await supabase
      .from('splits')
      .insert({
        description: split.description,
        total_amount: split.totalAmount,
        date: split.date,
        payer_address: split.payerAddress,
        participants: split.participants,
        payments: split.payments,
        source_tx_id: split.sourceTxId
      })
      .select()
      .single();

    if (error) {
      return json({ error: 'Failed to create split' }, { status: 500 });
    }

    const newSplit: Split = {
      id: data.id,
      description: data.description,
      totalAmount: data.total_amount,
      date: data.date,
      payerAddress: data.payer_address,
      participants: data.participants as unknown as Split['participants'],
      payments: data.payments as unknown as Split['payments'],
      createdAt: data.created_at as unknown as Split['createdAt'],
      sourceTxId: data.source_tx_id || undefined
    };

    return json(newSplit, { status: 201 });
  } catch (error) {
    console.error('Error creating split:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};
