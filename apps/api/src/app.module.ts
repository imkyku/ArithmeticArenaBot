import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
<<<<<<< HEAD
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { MatchmakingModule } from './matchmaking/matchmaking.module.js';
import { MatchesModule } from './matches/matches.module.js';
import { RatingsModule } from './ratings/ratings.module.js';
import { LeaderboardModule } from './leaderboard/leaderboard.module.js';
import { FriendMatchesModule } from './friend-matches/friend-matches.module.js';
import { HealthModule } from './health/health.module.js';
=======
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MatchmakingModule } from './matchmaking/matchmaking.module';
import { MatchesModule } from './matches/matches.module';
import { RatingsModule } from './ratings/ratings.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { FriendMatchesModule } from './friend-matches/friend-matches.module';
import { HealthModule } from './health/health.module';
>>>>>>> main

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    MongooseModule.forRoot(process.env.MONGODB_URI ?? 'mongodb://localhost:27017/arena'),
    AuthModule,
    UsersModule,
    MatchmakingModule,
    MatchesModule,
    RatingsModule,
    LeaderboardModule,
    FriendMatchesModule,
    HealthModule,
  ],
})
export class AppModule {}
