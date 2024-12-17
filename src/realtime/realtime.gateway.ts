import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true })
export class RealtimeGateway {
  @WebSocketServer()
  server: Server;

  // Notify clients about balance updates
  sendBalanceUpdate(walletId: string, newBalance: number) {
    this.server.emit('balanceUpdate', { walletId, newBalance });
  }

  // Optional: Handle custom client messages
  @SubscribeMessage('message')
  handleMessage(@MessageBody() message: string): string {
    console.log(`Message from client: ${message}`);
    return `Server received: ${message}`;
  }
}
