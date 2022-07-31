import { ConfigService } from "@nestjs/config";
import { EnvEnum } from "src/env.enum";
import { FilesWatermarkPlacementEnum } from "src/files/types/files-service.type";
import { SettingsKeyEnum } from "src/settings/types/settings-key.enum";
import { SettingsServiceEnum } from "src/settings/types/settings-service.enum";

export const settingsData = ( configService: ConfigService ) => [
  {
    key: SettingsKeyEnum.SMS_PROVIDER,
    value: configService.get( EnvEnum.SMS_PROVIDER ),
    service: SettingsServiceEnum.SMS,
    userAgent: "SYSTEM"
  },
  {
    key: SettingsKeyEnum.SMS_ORIGINATOR,
    value: configService.get( EnvEnum.SMS_ORIGINATOR ),
    service: SettingsServiceEnum.SMS,
    userAgent: "SYSTEM"
  },
  {
    key: SettingsKeyEnum.SMS_API_KEY,
    value: configService.get( EnvEnum.SMS_API_KEY ),
    service: SettingsServiceEnum.SMS,
    userAgent: "SYSTEM"
  },
  {
    key: SettingsKeyEnum.SMS_BIRTHDAY_CONGRATS,
    value: "false",
    service: SettingsServiceEnum.SMS,
    userAgent: "SYSTEM"
  },
  {
    key: SettingsKeyEnum.SMS_BIRTHDAY_CONGRATS_TIME,
    value: "12",
    service: SettingsServiceEnum.SMS,
    userAgent: "SYSTEM"
  },

  {
    key: SettingsKeyEnum.EMAIL_NEWSLETTER_SEND,
    value: "false",
    service: SettingsServiceEnum.EMAIL,
    userAgent: "SYSTEM"
  },
  {
    key: SettingsKeyEnum.EMAIL_NEWSLETTER_SEND_TIME,
    value: "18",
    service: SettingsServiceEnum.EMAIL,
    userAgent: "SYSTEM"
  },
  {
    key: SettingsKeyEnum.EMAIL_NEWSLETTER_HEADER,
    value: "false",
    service: SettingsServiceEnum.EMAIL,
    userAgent: "SYSTEM"
  },
  {
    key: SettingsKeyEnum.EMAIL_NEWSLETTER_BODY,
    value: "false",
    service: SettingsServiceEnum.EMAIL,
    userAgent: "SYSTEM"
  },
  {
    key: SettingsKeyEnum.EMAIL_NEWSLETTER_FOOTER,
    value: "false",
    service: SettingsServiceEnum.EMAIL,
    userAgent: "SYSTEM"
  },

  {
    key: SettingsKeyEnum.COMMENT_IS_APPROVED,
    value: "true",
    service: SettingsServiceEnum.POST_COMMENTS,
    userAgent: "SYSTEM"
  },
  {
    key: SettingsKeyEnum.COMMENT_FORBIDDEN_EXPRESSIONS,
    value: "forbidden_1,forbidden_2,forbidden_3,forbidden_4",
    service: SettingsServiceEnum.POST_COMMENTS,
    userAgent: "SYSTEM"
  },
  {
    key: SettingsKeyEnum.COMMENT_FORBIDDEN_SUSPEND,
    value: "true",
    service: SettingsServiceEnum.POST_COMMENTS,
    userAgent: "SYSTEM"
  },
  {
    key: SettingsKeyEnum.FILE_URL_EXP_HOURS,
    value: "24",
    service: SettingsServiceEnum.FILES,
    userAgent: "SYSTEM"
  },
  {
    key: SettingsKeyEnum.FILE_WATERMARK_ACTIVE,
    value: "true",
    service: SettingsServiceEnum.FILES,
    userAgent: "SYSTEM"
  },
  {
    key: SettingsKeyEnum.FILE_WATERMARK_IMAGE_ID,
    value: "",
    service: SettingsServiceEnum.FILES,
    userAgent: "SYSTEM"
  },
  {
    key: SettingsKeyEnum.FILE_WATERMARK_TO_IMAGE_DIMENSIONS,
    value: "0.2",
    service: SettingsServiceEnum.FILES,
    userAgent: "SYSTEM"
  },
  {
    key: SettingsKeyEnum.FILE_WATERMARK_PLACEMENT,
    value: FilesWatermarkPlacementEnum.TOP_RIGHT,
    service: SettingsServiceEnum.FILES,
    userAgent: "SYSTEM"
  },
  {
    key: SettingsKeyEnum.FILE_WATERMARK_MARGINS_TOP,
    value: "10",
    service: SettingsServiceEnum.FILES,
    userAgent: "SYSTEM"
  },
  {
    key: SettingsKeyEnum.FILE_WATERMARK_MARGINS_RIGHT,
    value: "10",
    service: SettingsServiceEnum.FILES,
    userAgent: "SYSTEM"
  },
  {
    key: SettingsKeyEnum.FILE_WATERMARK_MARGINS_BOTTOM,
    value: "10",
    service: SettingsServiceEnum.FILES,
    userAgent: "SYSTEM"
  },
  {
    key: SettingsKeyEnum.FILE_WATERMARK_MARGINS_LEFT,
    value: "10",
    service: SettingsServiceEnum.FILES,
    userAgent: "SYSTEM"
  },
  {
    key: SettingsKeyEnum.FILE_WATERMARK_OPACITY,
    value: "85",
    service: SettingsServiceEnum.FILES,
    userAgent: "SYSTEM"
  },
  {
    key: SettingsKeyEnum.FILE_WATERMARK_SIZES,
    value: "480,640,800,1200,1600",
    service: SettingsServiceEnum.FILES,
    userAgent: "SYSTEM"
  },
];