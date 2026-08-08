import { Module } from '@nestjs/common';
import { OrchardService } from './orchard.service';

@Module({ providers: [OrchardService], exports: [OrchardService] })
export class OrchardModule {}
