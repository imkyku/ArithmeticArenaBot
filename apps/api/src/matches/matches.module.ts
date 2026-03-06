import { Module } from '@nestjs/common';
import { MatchesController } from './matches.controller.js';
import { MatchGateway } from './matches.gateway.js';

@Module({ controllers: [MatchesController], providers: [MatchGateway] })
export class MatchesModule {}
