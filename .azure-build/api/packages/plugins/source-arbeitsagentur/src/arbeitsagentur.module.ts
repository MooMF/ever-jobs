import { Module } from '@nestjs/common';
import { ArbeitsagenturService } from './arbeitsagentur.service';

@Module({
  providers: [ArbeitsagenturService],
  exports: [ArbeitsagenturService],
})
export class ArbeitsagenturModule {}
