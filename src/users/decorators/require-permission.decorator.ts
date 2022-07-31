import { SetMetadata } from '@nestjs/common';
import { PermissionsEnum } from 'src/common/security/permissions.enum';

export const PERMISSION_KEY = 'permissions';
export const RequirePermission = ( ...permissions: PermissionsEnum[] ) => SetMetadata( PERMISSION_KEY, permissions );