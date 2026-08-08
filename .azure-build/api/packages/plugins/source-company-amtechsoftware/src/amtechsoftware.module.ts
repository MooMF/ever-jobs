import { Module } from '@nestjs/common';
import { AmtechsoftwareService } from './amtechsoftware.service';

@Module({ providers: [AmtechsoftwareService], exports: [AmtechsoftwareService] })
export class AmtechsoftwareModule {}
