import { Controller, Get, Param } from '@nestjs/common';

@Controller('matches')
export class MatchesController {
  @Get(':id')
  one(@Param('id') id: string): { id: string; status: string } {
    return { id, status: 'active' };
  }
}
