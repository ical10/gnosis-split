import { json } from '@sveltejs/kit';
import { supabase } from '$lib/server/supabase';
import type { RequestHandler } from '@sveltejs/kit';
import type { Split, Participant } from '$lib/types';

export const GET: RequestHandler = async ({ params }) => {
  if (!params.id) throw Error('Error when getting split');

  try {
    const { data, error } = await supabase
      .from('splits')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error || !data) {
      return json({ error: 'Split not found' }, { status: 404 });
    }

    const split: Split = {
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

    return json(split);
  } catch (error) {
    console.error('Error fetching split:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};

export const PUT: RequestHandler = async ({ params, request }) => {
  if (!params.id) throw Error("Error when updating split");

  try {
    const updatedSplit = await request.json();

    const { data, error } = await supabase
      .from('splits')
      .update({
        description: updatedSplit.description,
        total_amount: updatedSplit.totalAmount,
        date: updatedSplit.date,
        payer_address: updatedSplit.payerAddress,
        participants: updatedSplit.participants,
        payments: updatedSplit.payments,
        source_tx_id: updatedSplit.sourceTxId
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error || !data) {
      return json({ error: 'Failed to update split' }, { status: 500 });
    }

    const split: Split = {
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

    return json(split);
  } catch (error) {
    console.error('Error updating split:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};

export const DELETE: RequestHandler = async ({ params }) => {
  if (!params.id) throw Error('Error when deleting split');

  try {
    const { error } = await supabase
      .from('splits')
      .delete()
      .eq('id', params.id);

    if (error) {
      return json({ error: 'Failed to delete split' }, { status: 500 });
    }

    return json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting split:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};

export const PATCH: RequestHandler = async ({ params, request }) => {
  if (!params.id) throw Error('Error when updating participants');

  try {
    const { participants } = await request.json() as { participants: Participant[] };

    const { error } = await supabase
      .from('splits')
      .update({ participants: participants as any })
      .eq('id', params.id);

    if (error) {
      return json({ error: 'Failed to update participants' }, { status: 500 });
    }

    return json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error updating participants:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};
