import { Module } from '@nestjs/common';
import { ConstantContactService } from './constantcontact.service';

@Module({ providers: [ConstantContactService], exports: [ConstantContactService] })
export class ConstantContactModule {}
