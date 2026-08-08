import { Module } from '@nestjs/common';
import { IcimsService } from './icims.service';

@Module({
  providers: [IcimsService],
  exports: [IcimsService],
})
export class IcimsModule {}
