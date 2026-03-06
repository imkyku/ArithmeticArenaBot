import { Body, Controller, Param, Post } from '@nestjs/common';

@Controller('friend-matches')
export class FriendMatchesController {
  @Post()
  create(): { code: string } {
    return { code: Math.random().toString(36).slice(2, 8).toUpperCase() };
  }

  @Post(':code/join')
  join(@Param('code') code: string, @Body() _body: Record<string, unknown>): { code: string; ok: true } {
    return { code, ok: true };
  }
}
