import { json } from '@sveltejs/kit';
import { getSupabase } from '$lib/server/supabase';
import type { RequestHandler } from '@sveltejs/kit';
import type { Split, Participant } from '$lib/types';
import { SplitUpdateSchema, ParticipantsUpdateSchema } from '$lib/validation';
import { getAddress } from 'viem';

export const GET: RequestHandler = async ({ params, locals }) => {
  if (!params.id) throw Error('Error when getting split');

  const userAddress = locals.user?.user_metadata?.address;
  if (!userAddress) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('splits')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error || !data) {
      return json({ error: 'Split not found' }, { status: 404 });
    }

    const checksumUserAddress = getAddress(userAddress);
    const isCreator = data.payer_address === checksumUserAddress;
    const participants = data.participants as unknown as Participant[];
    const isParticipant = participants?.some(
      (p: Participant) => getAddress(p.address) === checksumUserAddress
    );

    if (!isCreator && !isParticipant) {
      return json({ error: 'Forbidden' }, { status: 403 });
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

export const PUT: RequestHandler = async ({ params, request, locals }) => {
  if (!params.id) throw Error("Error when updating split");

  const userAddress = locals.user?.user_metadata?.address;
  if (!userAddress) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validationResult = SplitUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      return json(
        { error: 'Validation failed', details: validationResult.error.flatten },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const { data: splitData, error: fetchError } = await supabase
      .from('splits')
      .select('*')
      .eq('id', params.id)
      .single();

    if (fetchError || !splitData) {
      return json({ error: 'Split not found' }, { status: 404 });
    }

    const checksumUserAddress = getAddress(userAddress);
    const isCreator = splitData.payer_address === checksumUserAddress;
    const participants = splitData.participants as unknown as Participant[];
    const isParticipant = participants?.some(
      (p: Participant) => getAddress(p.address) === checksumUserAddress
    );

    if (!isCreator && !isParticipant) {
      return json({ error: 'Forbidden' }, { status: 403 });
    }

    const updatedSplit = validationResult.data;

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

export const DELETE: RequestHandler = async ({ params, locals }) => {
  if (!params.id) throw Error('Error when deleting split');

  const userAddress = locals.user?.user_metadata?.address;
  if (!userAddress) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = getSupabase();

    // Fetch split and check authorization
    const { data: splitData, error: fetchError } = await supabase
      .from('splits')
      .select('*')
      .eq('id', params.id)
      .single();

    if (fetchError || !splitData) {
      return json({ error: 'Split not found' }, { status: 404 });
    }

    const checksumUserAddress = getAddress(userAddress);
    const isCreator = splitData.payer_address === checksumUserAddress;
    const participants = splitData.participants as unknown as Participant[];
    const isParticipant = participants?.some(
      (p: Participant) => getAddress(p.address) === checksumUserAddress
    );

    if (!isCreator && !isParticipant) {
      return json({ error: 'Forbidden' }, { status: 403 });
    }

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

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
  if (!params.id) throw Error('Error when updating participants');

  const userAddress = locals.user?.user_metadata?.address;
  if (!userAddress) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = getSupabase();

    // Fetch split and check authorization
    const { data: splitData, error: fetchError } = await supabase
      .from('splits')
      .select('*')
      .eq('id', params.id)
      .single();

    if (fetchError || !splitData) {
      return json({ error: 'Split not found' }, { status: 404 });
    }

    const checksumUserAddress = getAddress(userAddress);
    const isCreator = splitData.payer_address === checksumUserAddress;
    const participants = splitData.participants as unknown as Participant[];
    const isParticipant = participants?.some(
      (p: Participant) => getAddress(p.address) === checksumUserAddress
    );

    if (!isCreator && !isParticipant) {
      return json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validationResult = ParticipantsUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      return json(
        { error: 'Validation failed', details: validationResult.error.flatten },
        { status: 400 }
      );
    }

    const { participants: newParticipants } = validationResult.data;

    const { error } = await supabase
      .from('splits')
      .update({ participants: newParticipants as any })
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
