import { Module } from '@nestjs/common';
import { KlaviyoService } from './klaviyo.service';

@Module({ providers: [KlaviyoService], exports: [KlaviyoService] })
export class KlaviyoModule {}
