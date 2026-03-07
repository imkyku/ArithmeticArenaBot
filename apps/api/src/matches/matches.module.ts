import { Module } from '@nestjs/common';
<<<<<<< HEAD
import { MatchesController } from './matches.controller.js';
import { MatchGateway } from './matches.gateway.js';
=======
import { MatchesController } from './matches.controller';
import { MatchGateway } from './matches.gateway';
>>>>>>> main

@Module({ controllers: [MatchesController], providers: [MatchGateway] })
export class MatchesModule {}
