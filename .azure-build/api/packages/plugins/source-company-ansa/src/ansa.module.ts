import { Module } from '@nestjs/common';
import { AnsaService } from './ansa.service';

@Module({ providers: [AnsaService], exports: [AnsaService] })
export class AnsaModule {}
