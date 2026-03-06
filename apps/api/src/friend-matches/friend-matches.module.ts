import { Module } from '@nestjs/common';
import { FriendMatchesController } from './friend-matches.controller.js';

@Module({ controllers: [FriendMatchesController] })
export class FriendMatchesModule {}
