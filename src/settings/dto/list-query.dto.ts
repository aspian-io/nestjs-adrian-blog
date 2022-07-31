import { IsOptional } from "class-validator";
import { SettingsServiceEnum } from "../types/settings-service.enum";

export class SettingListQueryDto {
  @IsOptional()
  settingService: SettingsServiceEnum;
}