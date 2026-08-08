import { Module } from '@nestjs/common';
import { KeeperSecurityService } from './keepersecurity.service';

@Module({ providers: [KeeperSecurityService], exports: [KeeperSecurityService] })
export class KeeperSecurityModule {}
