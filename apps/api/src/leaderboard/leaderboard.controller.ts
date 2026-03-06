import { Controller, Get } from '@nestjs/common';

@Controller('leaderboard')
export class LeaderboardController {
  @Get()
  list(): { entries: unknown[] } {
    return { entries: [] };
  }
}
