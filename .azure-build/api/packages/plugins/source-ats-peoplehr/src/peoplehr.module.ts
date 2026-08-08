import { Module } from '@nestjs/common';
import { PeopleHrService } from './peoplehr.service';

@Module({
  providers: [PeopleHrService],
  exports: [PeopleHrService],
})
export class PeopleHrModule {}
