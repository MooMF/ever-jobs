import { Module } from '@nestjs/common';
import { OktaService } from './okta.service';

@Module({ providers: [OktaService], exports: [OktaService] })
export class OktaModule {}
