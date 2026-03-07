import { Body, Controller, Post } from '@nestjs/common';
<<<<<<< HEAD
import { AuthService } from './auth.service.js';
import { TelegramAuthDto } from './dto.js';
=======
import { AuthService } from './auth.service';
import { TelegramAuthDto } from './dto';
>>>>>>> main

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('telegram')
  async telegram(@Body() body: TelegramAuthDto): Promise<{ userId: string }> {
    return this.authService.bootstrap(body.initDataRaw);
  }
}
