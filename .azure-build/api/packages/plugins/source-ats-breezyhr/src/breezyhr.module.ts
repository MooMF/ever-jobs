import { Module } from '@nestjs/common';
import { BreezyHRService } from './breezyhr.service';

@Module({ providers: [BreezyHRService], exports: [BreezyHRService] })
export class BreezyHRModule {}
