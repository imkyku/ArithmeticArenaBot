import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import crypto from 'crypto';
<<<<<<< HEAD
import { User } from '../database/schemas.js';
=======
import { User } from '../database/schemas';
>>>>>>> main

@Injectable()
export class AuthService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<User>) {}

  validateTelegramInitData(initDataRaw: string): Record<string, string> {
    const params = new URLSearchParams(initDataRaw);
    const hash = params.get('hash');
    if (!hash) throw new UnauthorizedException('hash_missing');

    const entries = Array.from(params.entries()).filter(([k]) => k !== 'hash').sort(([a], [b]) => a.localeCompare(b));
    const dataCheckString = entries.map(([k, v]) => `${k}=${v}`).join('\n');

    const secret = crypto.createHmac('sha256', 'WebAppData').update(process.env.TELEGRAM_BOT_TOKEN ?? '').digest();
    const expectedHash = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex');
    if (expectedHash !== hash) throw new UnauthorizedException('invalid_signature');

    const authDate = Number(params.get('auth_date'));
    const now = Math.floor(Date.now() / 1000);
    if (!Number.isFinite(authDate) || now - authDate > 300) throw new UnauthorizedException('auth_expired');

    const userRaw = params.get('user');
    if (!userRaw) throw new UnauthorizedException('user_missing');
    return JSON.parse(userRaw) as Record<string, string>;
  }

  async bootstrap(initDataRaw: string): Promise<{ userId: string }> {
    const tgUser = this.validateTelegramInitData(initDataRaw);
    const user = await this.userModel.findOneAndUpdate(
      { telegramId: String(tgUser.id) },
      {
        telegramId: String(tgUser.id),
        username: tgUser.username,
        firstName: tgUser.first_name,
        lastName: tgUser.last_name,
        lastSeenAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    return { userId: user._id.toString() };
  }
}
