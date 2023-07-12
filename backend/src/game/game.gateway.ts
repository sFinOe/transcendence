import { Catch, UseFilters, UsePipes, ValidationPipe } from '@nestjs/common';
import {
  BaseWsExceptionFilter,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { GameService } from './game.service';
import { HttpGatewayExceptionFilter } from './game-exception.filter';
import { verify } from 'jsonwebtoken';
import { Server } from 'socket.io';
import { User } from '@prisma/client';

@Catch()
@UsePipes(new ValidationPipe())
@UseFilters(BaseWsExceptionFilter, HttpGatewayExceptionFilter)
@WebSocketGateway({
  namespace: 'game',
  cors: {
    origin: 'http://localhost:3000',
  },
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() readonly wss: Server;

  constructor(private readonly game: GameService) {}

  handleDisconnect(socket) {
    this.game.leave(socket);
  }

  async handleConnection(socket) {
    try {
      if (!socket.handshake.auth.token) throw new Error('No token');
      const user = verify(
        socket.handshake.auth.token,
        process.env.AUTH_JWT_SECRET,
      ) as User;
      if (!user) throw new Error('Invalid token');
      socket.data = await this.game.getPlayer(user.id);
    } catch (err) {
      socket.emit('exception', err.error || err.message || err);
      socket.disconnect();
    }
  }

  @SubscribeMessage('join')
  handlePlayerJoin(socket, body) {
    return this.game.join(socket, body);
  }

  @SubscribeMessage('ready')
  handlePlayerReady(socket, ready) {
    return this.game.ready(socket, ready);
  }

  @SubscribeMessage('pong')
  handlePlayerPong(socket, key) {
    return this.game.pong(socket, key);
  }

  @SubscribeMessage('move')
  handlePlayerMove(socket, crd) {
    return this.game.move(socket, crd);
  }
}
