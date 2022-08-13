import { ThrottlerGuard, ThrottlerModuleOptions, ThrottlerStorage } from '@nestjs/throttler';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { EnvEnum } from 'src/env.enum';

@Injectable()
export class ThrottlerBehindProxyGuard extends ThrottlerGuard {
  constructor (
    protected readonly options: ThrottlerModuleOptions,
    protected readonly storageService: ThrottlerStorage,
    protected readonly reflector: Reflector,
    private readonly consfigService: ConfigService
  ) {
    super( options, storageService, reflector );
  }
  protected errorMessage: string = this.consfigService.getOrThrow( EnvEnum.THROTTLE_ERROR_MESSAGE );
  protected getTracker ( req: Record<string, any> ): string {
    return req.ips.length ? req.ips[ 0 ] : req.ip; // individualize IP extraction to meet your own needs
  }
}