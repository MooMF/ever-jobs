import { Module } from '@nestjs/common';
import { BenevityService } from './benevity.service';

@Module({ providers: [BenevityService], exports: [BenevityService] })
export class BenevityModule {}
