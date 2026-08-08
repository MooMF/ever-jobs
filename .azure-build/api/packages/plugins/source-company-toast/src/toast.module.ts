import { Module } from '@nestjs/common';
import { ToastService } from './toast.service';

@Module({ providers: [ToastService], exports: [ToastService] })
export class ToastModule {}
