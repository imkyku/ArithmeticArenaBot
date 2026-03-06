import { IsString } from 'class-validator';

export class TelegramAuthDto {
  @IsString()
  initDataRaw!: string;
}
