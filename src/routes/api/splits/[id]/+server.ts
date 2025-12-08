import { json } from '@sveltejs/kit';
import { getSupabase } from '$lib/server/supabase';
import type { RequestHandler } from '@sveltejs/kit';
import type { Split, Participant } from '$lib/types';
import { SplitUpdateSchema, ParticipantsUpdateSchema } from '$lib/validation';

export const GET: RequestHandler = async ({ params, url }) => {
  if (!params.id) throw Error('Error when getting split');

  try {
    const userAddress = url.searchParams.get('address');
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('splits')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error || !data) {
      return json({ error: 'Split not found' }, { status: 404 });
    }

    if (userAddress) {
      const isCreator = data.payer_address.toLowerCase() === userAddress.toLowerCase();
      const participants = data.participants as unknown as Participant[];
      const isParticipant = participants?.some(
        (p: Participant) => p.address.toLowerCase() === userAddress.toLowerCase()
      );

      if (!isCreator && !isParticipant) {
        return json({ error: 'Unauthorized' }, { status: 403 });
      }
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
    const body = await request.json();
    const validationResult = SplitUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      return json(
        { error: 'Validation failed', details: validationResult.error.flatten },
        { status: 400 }
      );
    }

    const updatedSplit = validationResult.data;
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('splits')
      .update({
        description: updatedSplit.description,
        total_amount: updatedSplit.totalAmount,
        date: updatedSplit.date,
        payer_address: updatedSplit.payerAddress,
        participants: updatedSplit.participants as any,
        payments: updatedSplit.payments as any,
        source_tx_id: updatedSplit.sourceTxId
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Database error updating split:', error);
      return json({ error: 'Failed to update split' }, { status: 500 });
    }

    if (!data) {
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
    console.error('Error updating split:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};

export const DELETE: RequestHandler = async ({ params }) => {
  if (!params.id) throw Error('Error when deleting split');

  try {
    const supabase = getSupabase();
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
    const supabase = getSupabase();
    const { data: existingSplit, error: fetchError } = await supabase
      .from('splits')
      .select('id')
      .eq('id', params.id)
      .single();

    if (fetchError || !existingSplit) {
      return json({ error: 'Split not found' }, { status: 404 });
    }

    const body = await request.json();
    const validationResult = ParticipantsUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      return json(
        { error: 'Validation failed', details: validationResult.error.flatten },
        { status: 400 }
      );
    }

    const { participants } = validationResult.data;

    const { error } = await supabase
      .from('splits')
      .update({ participants: participants as any })
      .eq('id', params.id);

    if (error) {
      console.error('Database error updating participants:', error);
      return json({ error: 'Failed to update participants' }, { status: 500 });
    }

    return json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error updating participants:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};
