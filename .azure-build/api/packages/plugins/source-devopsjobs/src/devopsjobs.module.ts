import { Module } from '@nestjs/common';
import { DevopsjobsService } from './devopsjobs.service';

@Module({
  providers: [DevopsjobsService],
  exports: [DevopsjobsService],
})
export class DevopsjobsModule {}
