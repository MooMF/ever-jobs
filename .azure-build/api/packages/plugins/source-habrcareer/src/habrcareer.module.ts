import { Module } from '@nestjs/common';
import { HabrcareerService } from './habrcareer.service';

@Module({
  providers: [HabrcareerService],
  exports: [HabrcareerService],
})
export class HabrcareerModule {}
