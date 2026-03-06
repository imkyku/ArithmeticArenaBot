import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ namespace: '/realtime', cors: { origin: '*' } })
export class MatchmakingGateway {
  @WebSocketServer() server!: Server;

  @SubscribeMessage('matchmaking:join')
  joinQueue(@ConnectedSocket() client: Socket, @MessageBody() body: { rating: number }): void {
    client.emit('matchmaking:queued', { joinedAt: Date.now(), range: Math.max(100, Math.floor(body.rating / 10)) });
  }

  @SubscribeMessage('matchmaking:leave')
  leaveQueue(@ConnectedSocket() client: Socket): void {
    client.emit('system:notice', { code: 'queue_left' });
  }
}
