import { Module } from '@nestjs/common';
import { AbnormalsecurityService } from './abnormalsecurity.service';

@Module({ providers: [AbnormalsecurityService], exports: [AbnormalsecurityService] })
export class AbnormalsecurityModule {}
