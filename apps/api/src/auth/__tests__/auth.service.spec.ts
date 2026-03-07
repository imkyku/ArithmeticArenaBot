import { UnauthorizedException } from '@nestjs/common';
<<<<<<< HEAD
import { AuthService } from '../../auth.service.js';
=======
import { AuthService } from '../../auth.service';
>>>>>>> main

describe('AuthService', () => {
  it('rejects payload without hash', () => {
    const service = new AuthService({} as never);
    expect(() => service.validateTelegramInitData('auth_date=1')).toThrow(UnauthorizedException);
  });
});
