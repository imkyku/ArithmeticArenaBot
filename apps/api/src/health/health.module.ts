import { Module } from '@nestjs/common';
<<<<<<< HEAD
import { HealthController } from './health.controller.js';
=======
import { HealthController } from './health.controller';
>>>>>>> main

@Module({ controllers: [HealthController] })
export class HealthModule {}
