import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth } from '@nestjs/swagger';
import { GameService } from './game.service';

@Controller({
  path: 'game',
  version: '1',
})
export class GameController {
  constructor(private readonly game: GameService) {}

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  getPlayer(@Req() req) {
    return this.game.getPlayer(req.user.id);
  }

  @Get('games')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  getGames(@Req() req) {
    return this.game.getGames(req.user.id);
  }
}
