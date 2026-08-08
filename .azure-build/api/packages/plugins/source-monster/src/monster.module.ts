import { Module } from '@nestjs/common';
import { MonsterService } from './monster.service';

@Module({
  providers: [MonsterService],
  exports: [MonsterService],
})
export class MonsterModule {}
