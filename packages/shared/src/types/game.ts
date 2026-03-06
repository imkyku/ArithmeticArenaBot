export type OperationType = 'add' | 'sub' | 'mul' | 'div';

export interface OperationIntent {
  seq: number;
  operationType: OperationType;
  operand: string;
  clientSentAt: number;
}

export interface PlayerState {
  userId: string;
  currentValue: string;
  storedElixir: number;
  lastElixirUpdateAt: number;
  connected: boolean;
  surrendered: boolean;
  lastSeq: number;
}

export interface MatchState {
  id: string;
  type: 'ranked' | 'friendly';
  startNumber: string;
  targetNumber: string;
  status: 'waiting' | 'active' | 'finished' | 'cancelled';
  startedAt: number;
  finishesAt: number;
  version: number;
  players: PlayerState[];
}
