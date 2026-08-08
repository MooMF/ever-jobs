import { Module } from '@nestjs/common';
import { CatsoneService } from './catsone.service';

@Module({
  providers: [CatsoneService],
  exports: [CatsoneService],
})
export class CatsoneModule {}
