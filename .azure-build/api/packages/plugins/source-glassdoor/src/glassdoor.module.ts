import { Module } from '@nestjs/common';
import { GlassdoorService } from './glassdoor.service';

@Module({
  providers: [GlassdoorService],
  exports: [GlassdoorService],
})
export class GlassdoorModule {}
