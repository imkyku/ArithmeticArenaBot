import { matchOperationSchema } from '@arena/shared';
import { useEffect, useState } from 'react';
import { matchSocket } from '../services/socket';

interface SubmitOperationInput {
  matchId: string;
  seq: number;
  operationType: 'add' | 'sub' | 'mul' | 'div';
  operand: string;
  currentValue: string;
  targetValue: string;
  storedElixir: number;
  lastElixirUpdateAt: number;
}

export const useMatchRealtime = (matchId: string) => {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentValue, setCurrentValue] = useState('100000000000000');
  const [targetValue] = useState('999');
  const [elixir, setElixir] = useState(10);

  useEffect(() => {
    if (!matchSocket.connected) {
      matchSocket.connect();
    }

    const onConnect = () => {
      setConnected(true);
      matchSocket.emit('match:join', { matchId });
    };
    const onDisconnect = () => setConnected(false);
    const onError = (payload: { reason?: string }) => setError(payload.reason ?? 'unknown_error');
    const onState = (payload: { currentValue: string; storedElixir: number }) => {
      setCurrentValue(payload.currentValue);
      setElixir(payload.storedElixir);
    };

    matchSocket.on('connect', onConnect);
    matchSocket.on('disconnect', onDisconnect);
    matchSocket.on('match:error', onError);
    matchSocket.on('match:state', onState);

    if (matchSocket.connected) onConnect();

    return () => {
      matchSocket.off('connect', onConnect);
      matchSocket.off('disconnect', onDisconnect);
      matchSocket.off('match:error', onError);
      matchSocket.off('match:state', onState);
    };
  }, [matchId]);

  const submitOperation = (input: SubmitOperationInput) => {
    const payload = {
      matchId: input.matchId,
      seq: input.seq,
      operationType: input.operationType,
      operand: input.operand,
    };

    if (!matchOperationSchema.safeParse(payload).success) {
      setError('invalid_operation_payload');
      return;
    }

    matchSocket.emit('match:operation', {
      ...input,
      lastElixirUpdateAt: input.lastElixirUpdateAt,
    });
  };

  return {
    connected,
    error,
    currentValue,
    targetValue,
    elixir,
    submitOperation,
  };
};
