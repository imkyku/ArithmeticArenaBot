import { Module } from '@nestjs/common';
import { FriendMatchesController } from './friend-matches.controller';

@Module({ controllers: [FriendMatchesController] })
export class FriendMatchesModule {}
