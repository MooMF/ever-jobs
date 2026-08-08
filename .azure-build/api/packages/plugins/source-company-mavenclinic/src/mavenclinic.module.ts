import { Module } from '@nestjs/common';
import { MavenclinicService } from './mavenclinic.service';

@Module({ providers: [MavenclinicService], exports: [MavenclinicService] })
export class MavenclinicModule {}
