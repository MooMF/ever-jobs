import { Module } from '@nestjs/common';
import { XairaTherapeuticsService } from './xairatherapeutics.service';

@Module({ providers: [XairaTherapeuticsService], exports: [XairaTherapeuticsService] })
export class XairaTherapeuticsModule {}
