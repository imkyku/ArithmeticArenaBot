import { Module } from '@nestjs/common';
<<<<<<< HEAD
import { MatchmakingGateway } from './matchmaking.gateway.js';
=======
import { MatchmakingGateway } from './matchmaking.gateway';
>>>>>>> main

@Module({ providers: [MatchmakingGateway] })
export class MatchmakingModule {}
