import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { SettingsService } from 'src/settings/settings.service';
import { SettingsKeyEnum } from 'src/settings/types/settings-key.enum';

@Injectable()
export class UsersAvatarGuard implements CanActivate {
  constructor ( private readonly settingsService: SettingsService ) { }
  async canActivate (
    context: ExecutionContext,
  ): Promise<boolean> {
    return ( await this.settingsService.findOne( SettingsKeyEnum.USERS_AVATARS_ENABLE ) ).value === "true";
  }
}
