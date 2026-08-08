import { Module } from '@nestjs/common';
import { ExpressvpnService } from './expressvpn.service';

@Module({ providers: [ExpressvpnService], exports: [ExpressvpnService] })
export class ExpressvpnModule {}
