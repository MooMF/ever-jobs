import { Module } from '@nestjs/common';
import { PlaidService } from './plaid.service';

@Module({ providers: [PlaidService], exports: [PlaidService] })
export class PlaidModule {}
