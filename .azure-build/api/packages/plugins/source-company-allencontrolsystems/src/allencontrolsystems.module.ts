import { Module } from '@nestjs/common';
import { AllencontrolsystemsService } from './allencontrolsystems.service';

@Module({ providers: [AllencontrolsystemsService], exports: [AllencontrolsystemsService] })
export class AllencontrolsystemsModule {}
