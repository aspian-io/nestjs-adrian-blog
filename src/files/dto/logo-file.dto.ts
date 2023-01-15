import { Expose, Type } from "class-transformer";
import { SettingsKeyEnum } from "src/settings/types/settings-key.enum";

class LogoFile {
  @Expose()
  key: string;

  @Expose()
  filename: string;

  @Expose()
  imageAlt?: string;
}

export class LogoFileDto {
  @Expose()
  type: SettingsKeyEnum;

  @Expose()
  @Type( () => LogoFile )
  file: LogoFile;
}