import { Module } from '@nestjs/common';
import { MatchesController } from './matches.controller';
import { MatchGateway } from './matches.gateway';

@Module({ controllers: [MatchesController], providers: [MatchGateway] })
export class MatchesModule {}
