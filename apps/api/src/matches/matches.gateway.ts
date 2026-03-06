import { applyOperation, computeElixir, getOperationCost, parseBigIntString, validateOperationRange } from '@arena/shared';
import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { z } from 'zod';

const operationSchema = z.object({
  matchId: z.string(),
  seq: z.number().int().nonnegative(),
  operationType: z.enum(['add', 'sub', 'mul', 'div']),
  operand: z.string().regex(/^\d+$/),
  currentValue: z.string().regex(/^\d+$/),
  targetValue: z.string().regex(/^\d+$/),
  storedElixir: z.number().int().min(0).max(10),
  lastElixirUpdateAt: z.number().int().nonnegative(),
});

@WebSocketGateway({ namespace: '/match', cors: { origin: '*' } })
export class MatchGateway {
  @WebSocketServer() server!: Server;

  @SubscribeMessage('match:join')
  join(@ConnectedSocket() client: Socket, @MessageBody() body: { matchId: string }): void {
    client.join(body.matchId);
    client.emit('match:event', { type: 'joined', serverTs: Date.now() });
  }

  @SubscribeMessage('match:operation')
  operation(@ConnectedSocket() client: Socket, @MessageBody() payload: unknown): void {
    const parsed = operationSchema.safeParse(payload);
    if (!parsed.success) {
      client.emit('match:error', { reason: 'invalid_payload' });
      return;
    }

    const data = parsed.data;
    const operandNum = Number(data.operand);
    if (!validateOperationRange(data.operationType, operandNum)) {
      client.emit('match:error', { reason: 'operand_out_of_range' });
      return;
    }

    const now = Date.now();
    const elixir = computeElixir(data.storedElixir, data.lastElixirUpdateAt, now);
    const cost = getOperationCost(data.operationType, operandNum);
    if (elixir.value < cost) {
      client.emit('match:error', { reason: 'insufficient_elixir' });
      return;
    }

    try {
      const applied = applyOperation(
        parseBigIntString(data.currentValue),
        parseBigIntString(data.targetValue),
        data.operationType,
        parseBigIntString(data.operand),
      );
      this.server.to(data.matchId).emit('match:state', {
        matchId: data.matchId,
        version: data.seq,
        currentValue: applied.nextValue.toString(),
        distance: applied.nextDistance.toString(),
        storedElixir: elixir.value - cost,
        lastElixirUpdateAt: elixir.recalculatedAt,
        serverTs: now,
      });
    } catch (error) {
      client.emit('match:error', { reason: error instanceof Error ? error.message : 'invalid_operation' });
    }
  }

  @SubscribeMessage('match:surrender')
  surrender(@ConnectedSocket() client: Socket): void {
    client.emit('match:finished', { resultType: 'surrender' });
  }
}
