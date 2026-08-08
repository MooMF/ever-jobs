import { Module } from '@nestjs/common';
import { PythonJobsService } from './pythonjobs.service';

@Module({
  providers: [PythonJobsService],
  exports: [PythonJobsService],
})
export class PythonJobsModule {}
