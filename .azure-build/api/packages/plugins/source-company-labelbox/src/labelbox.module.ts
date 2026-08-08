import { Module } from '@nestjs/common';
import { LabelboxService } from './labelbox.service';

@Module({ providers: [LabelboxService], exports: [LabelboxService] })
export class LabelboxModule {}
