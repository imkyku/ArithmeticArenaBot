import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../../auth.service';

describe('AuthService', () => {
  it('rejects payload without hash', () => {
    const service = new AuthService({} as never);
    expect(() => service.validateTelegramInitData('auth_date=1')).toThrow(UnauthorizedException);
  });
});
