import { Module } from '@nestjs/common';
import { LiveHireService } from './livehire.service';

@Module({
  providers: [LiveHireService],
  exports: [LiveHireService],
})
export class LiveHireModule {}
