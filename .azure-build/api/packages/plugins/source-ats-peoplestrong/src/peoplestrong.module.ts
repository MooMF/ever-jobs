import { Module } from '@nestjs/common';
import { PeopleStrongService } from './peoplestrong.service';

@Module({
  providers: [PeopleStrongService],
  exports: [PeopleStrongService],
})
export class PeopleStrongModule {}
