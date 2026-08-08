import { Module } from '@nestjs/common';
import { PeopleFluentService } from './peoplefluent.service';

@Module({
  providers: [PeopleFluentService],
  exports: [PeopleFluentService],
})
export class PeopleFluentModule {}
