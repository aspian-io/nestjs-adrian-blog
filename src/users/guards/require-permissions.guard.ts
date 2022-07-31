import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsEnum } from 'src/common/security/permissions.enum';
import { PERMISSION_KEY } from '../decorators/require-permission.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor ( private reflector: Reflector ) { }

  canActivate ( context: ExecutionContext ): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<PermissionsEnum[]>( PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ] );
    if ( !requiredPermissions ) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    
    return requiredPermissions.some( ( claim ) => user.claims.includes( claim ) );
  }
}