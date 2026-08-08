import { Module } from '@nestjs/common';
import { JobTechDevService } from './jobtechdev.service';

@Module({
  providers: [JobTechDevService],
  exports: [JobTechDevService],
})
export class JobTechDevModule {}
