import { OnModuleInit, UseGuards } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WsJwtGuard } from 'src/auth/ws-jwt/ws-jwt.guard';
import { SocketAuthMiddleware } from 'src/auth/ws.middleware';
import { ChannelService } from './channel/channel.service';
import { PrivateChatService } from './private/privateChat.service';
interface Message {
  room: string;
  msg: string;
}
@WebSocketGateway({
  namespace: 'chat',
  cors: {
    origin: 'http://localhost:3000',
  },
})
@UseGuards(WsJwtGuard)
export default class ChatGateway {
  constructor(
    private channelService: ChannelService,
    private privateChatService: PrivateChatService,
  ) {}
  @WebSocketServer()
  server: Server;

  afterInit(client: Socket) {
    client.use(SocketAuthMiddleware() as any);
    client.on('connection', (socket) => {
      console.log('chat member connected: ', socket.id);
    });
  }

  // private chat

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('private/join-room')
  joinPrivateRoom(
    @MessageBody() room: any,
    @ConnectedSocket() client: Socket,
  ): void {
    console.log('joinPrivateRoom: ', room);
    client.rooms.forEach((room) => {
      client.leave(room);
    });
    client.join(room);
    console.log(client.rooms);
  }

  @SubscribeMessage('private/sendMsg')
  async SendPrivateMessage(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ) {
    console.log('SendPrivateMessage: ', data);
    const createdMessage = await this.privateChatService.createMessage(
      client.data,
      data,
    );
    this.server.to(data.id).emit('private/newMsg', createdMessage);
  }

  // channels chat

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('channel/join-room')
  joinChannelRoom(
    @MessageBody() room: any,
    @ConnectedSocket() client: Socket,
  ): void {
    console.log('joinChannelRoom: ', room);
    client.rooms.forEach((room) => {
      client.leave(room);
    });
    client.join(room);
  }

  @SubscribeMessage('channel/sendMsg')
  async SendChannelMessage(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ) {
    console.log('SendChannelMessage: ', data);
    const createdMessage = await this.channelService.createMessage(
      client.data,
      data,
    );
    this.server.to(data.name).emit('channel/newMsg', createdMessage);
  }
}
