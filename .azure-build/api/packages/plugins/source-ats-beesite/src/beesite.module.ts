import { Module } from '@nestjs/common';
import { BeeSiteService } from './beesite.service';

@Module({
  providers: [BeeSiteService],
  exports: [BeeSiteService],
})
export class BeeSiteModule {}
