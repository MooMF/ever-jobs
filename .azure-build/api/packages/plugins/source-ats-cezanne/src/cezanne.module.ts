import { Module } from '@nestjs/common';
import { CezanneService } from './cezanne.service';

@Module({
  providers: [CezanneService],
  exports: [CezanneService],
})
export class CezanneModule {}
