import { Module } from '@nestjs/common';
import { PyjamaHrService } from './pyjamahr.service';

@Module({
  providers: [PyjamaHrService],
  exports: [PyjamaHrService],
})
export class PyjamaHrModule {}
