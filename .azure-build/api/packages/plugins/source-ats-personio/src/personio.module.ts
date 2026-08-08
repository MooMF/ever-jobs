import { Module } from '@nestjs/common';
import { PersonioService } from './personio.service';

@Module({
  providers: [PersonioService],
  exports: [PersonioService],
})
export class PersonioModule {}
