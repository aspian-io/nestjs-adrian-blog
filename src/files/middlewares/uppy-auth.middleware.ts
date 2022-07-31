import { CanActivate, ForbiddenException, Inject, Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PermissionsEnum } from 'src/common/security/permissions.enum';

@Injectable()
export class UppyAuthMiddleware implements NestMiddleware {
  constructor ( @Inject( 'UppyJwtGuard' ) private readonly guard: CanActivate ) { }
  async use ( req: Request, res: Response, next: NextFunction ) {
    const canActivate = await this.guard.canActivate( {
      switchToHttp: () => ( {
        getRequest: () => req,
        getResponse: () => res,
        getNext: () => next,
      } ),
    } as any );

    const hasRequiredClaims = [ PermissionsEnum.ADMIN, PermissionsEnum.FILE_CREATE ]
      .some( p => [ ...req.user[ 'claims' ] ].includes( p ) );

    if ( canActivate && hasRequiredClaims ) {
      next();
    } else {
      throw new ForbiddenException();
    }
  }
}
