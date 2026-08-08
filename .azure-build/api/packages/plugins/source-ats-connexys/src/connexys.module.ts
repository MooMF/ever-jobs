import { Module } from '@nestjs/common';
import { ConnexysService } from './connexys.service';

@Module({
  providers: [ConnexysService],
  exports: [ConnexysService],
})
export class ConnexysModule {}
