import { Module } from '@nestjs/common';
import { ImplyService } from './imply.service';

@Module({ providers: [ImplyService], exports: [ImplyService] })
export class ImplyModule {}
