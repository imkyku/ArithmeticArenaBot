import { Controller, Get } from '@nestjs/common';

@Controller()
export class UsersController {
  @Get('me')
  me(): { status: string } {
    return { status: 'ok' };
  }

  @Get('me/history')
  history(): { items: unknown[] } {
    return { items: [] };
  }
}
