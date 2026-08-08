import { Module } from '@nestjs/common';
import { OlipopService } from './olipop.service';

@Module({ providers: [OlipopService], exports: [OlipopService] })
export class OlipopModule {}
