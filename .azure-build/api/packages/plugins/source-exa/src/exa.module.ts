import { Module } from '@nestjs/common';
import { ExaService } from './exa.service';

@Module({
  providers: [ExaService],
  exports: [ExaService],
})
export class ExaModule {}
