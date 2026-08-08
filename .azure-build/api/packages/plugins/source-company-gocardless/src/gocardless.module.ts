import { Module } from '@nestjs/common';
import { GocardlessService } from './gocardless.service';

@Module({ providers: [GocardlessService], exports: [GocardlessService] })
export class GocardlessModule {}
