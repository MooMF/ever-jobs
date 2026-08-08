import { Module } from '@nestjs/common';
import { WebflowService } from './webflow.service';

@Module({ providers: [WebflowService], exports: [WebflowService] })
export class WebflowModule {}
