import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { TelegramAuthDto } from './dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('telegram')
  async telegram(@Body() body: TelegramAuthDto): Promise<{ userId: string }> {
    return this.authService.bootstrap(body.initDataRaw);
  }
}
