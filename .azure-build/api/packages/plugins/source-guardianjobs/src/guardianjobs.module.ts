import { Module } from '@nestjs/common';
import { GuardianjobsService } from './guardianjobs.service';

@Module({
  providers: [GuardianjobsService],
  exports: [GuardianjobsService],
})
export class GuardianjobsModule {}
