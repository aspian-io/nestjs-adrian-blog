import { ConfigService } from "@nestjs/config";
import { EnvEnum } from "src/env.enum";
import { FilesWatermarkPlacementEnum } from "src/files/types/files-service.type";
import { SettingsKeyEnum } from "src/settings/types/settings-key.enum";
import { SettingsServiceEnum } from "src/settings/types/settings-service.enum";

export const settingsData = ( configService: ConfigService ) => [
  {
    key: SettingsKeyEnum.SITE_NAME,
    value: "Adrian",
    service: SettingsServiceEnum.GENERAL,
    userAgent: "SYSTEM"
  },
  {
    key: SettingsKeyEnum.SITE_DESCRIPTION,
    value: "A site to test Adrian platform",
    service: SettingsServiceEnum.GENERAL,
    userAgent: "SYSTEM"
  },
  {
    key: SettingsKeyEnum.SITE_URL,
    value: "http://www.adrian.com",
    service: SettingsServiceEnum.GENERAL,
    userAgent: "SYSTEM"
  },
  {
    key: SettingsKeyEnum.SITE_ADMIN_EMAIL,
    value: "admin@example.com",
    service: SettingsServiceEnum.GENERAL,
    userAgent: "SYSTEM"
  },
  {
    key: SettingsKeyEnum.SITE_CONTACT_EMAIL,
    value: "admin@example.com",
    service: SettingsServiceEnum.GENERAL,
    userAgent: "SYSTEM"
  },
  {
    key: SettingsKeyEnum.SITE_SUPPORT_EMAIL,
    value: "support@example.com",
    service: SettingsServiceEnum.GENERAL,
    userAgent: "SYSTEM"
  },
  {
    key: SettingsKeyEnum.CONTACT_AUTO_RESPONSE_EMAIL_SUBJECT,
    value: "We Received Your Message",
    service: SettingsServiceEnum.CONTACT,
    userAgent: "SYSTEM"
  },
  {
    key: SettingsKeyEnum.USERS_LOGIN_BY_EMAIL,
    value: "true",
    service: SettingsServiceEnum.USERS,
    userAgent: "SYSTEM"
  },
  {
    key: SettingsKeyEnum.USERS_LOGIN_BY_MOBILE_PHONE,
    value: "true",
    service: SettingsServiceEnum.USERS,
    userAgent: "SYSTEM"
  },
  {
    key: SettingsKeyEnum.USERS_AVATARS_ENABLE,
    value: "false",
    service: SettingsServiceEnum.USERS,
    userAgent: "SYSTEM"
  },
  {
    key: SettingsKeyEnum.USERS_EMAIL_VERIFICATION_SUBJECT,
    value: "Email address verification",
    service: SettingsServiceEnum.USERS,
    userAgent: "SYSTEM"
  },
  {
    key: SettingsKeyEnum.USERS_EMAIL_TOKEN_EXP_IN_MINS,
    value: "10",
    service: SettingsServiceEnum.USERS,
    userAgent: "SYSTEM"
  },
  {
    key: SettingsKeyEnum.USERS_EMAIL_RESET_PASSWORD_SUBJECT,
    value: "Reset Password",
    service: SettingsServiceEnum.USERS,
    userAgent: "SYSTEM"
  },
  {
    key: SettingsKeyEnum.USERS_EMAIL_CHANGE_PASSWORD_SUBJECT,
    value: "Your Password Changed",
    service: SettingsServiceEnum.USERS,
    userAgent: "SYSTEM"
  },
  {
    key: SettingsKeyEnum.USERS_MOBILE_VERIFICATION_SMS_PATTERN_CODE,
    value: configService.get( EnvEnum.SMS_MOBILE_VERIFICATION_PATTERN_CODE ),
    service: SettingsServiceEnum.USERS,
    userAgent: "SYSTEM"
  },
  {
    key: SettingsKeyEnum.USERS_MOBILE_TOKEN_EXP_IN_MINS,
    value: "2",
    service: SettingsServiceEnum.USERS,
    userAgent: "SYSTEM"
  },
  {
    key: SettingsKeyEnum.SMS_DEFAULT_ORIGINATOR,
    value: configService.get( EnvEnum.SMS_DEFAULT_ORIGINATOR ),
    service: SettingsServiceEnum.SMS,
    userAgent: "SYSTEM"
  },

  {
    key: SettingsKeyEnum.COMMENT_IS_APPROVED,
    value: "true",
    service: SettingsServiceEnum.COMMENTS,
    userAgent: "SYSTEM"
  },
  {
    key: SettingsKeyEnum.COMMENT_FORBIDDEN_EXPRESSIONS,
    value: "forbidden_1,forbidden_2,forbidden_3,forbidden_4",
    service: SettingsServiceEnum.COMMENTS,
    userAgent: "SYSTEM"
  },
  {
    key: SettingsKeyEnum.COMMENT_FORBIDDEN_SUSPEND,
    value: "true",
    service: SettingsServiceEnum.COMMENTS,
    userAgent: "SYSTEM"
  },
  {
    key: SettingsKeyEnum.COMMENT_MAX_LENGTH,
    value: "200",
    service: SettingsServiceEnum.COMMENTS,
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
  {
    key: SettingsKeyEnum.NEWSLETTER_SUBSCRIPTION_TOKEN_EXP_IN_MINS,
    value: "2",
    service: SettingsServiceEnum.NEWSLETTER,
    userAgent: "SYSTEM"
  },
  {
    key: SettingsKeyEnum.NEWSLETTER_SUBSCRIPTION_EMAIL_SUBJECT,
    value: "Newsletter subscription",
    service: SettingsServiceEnum.NEWSLETTER,
    userAgent: "SYSTEM"
  },
  {
    key: SettingsKeyEnum.NEWSLETTER_CAN_SPAM,
    value: "You have received this email because you have subscribed to <a href='{{homepage}}'>{{company}}</a> as {{email}}. If you no longer wish to receive emails please {{unsub}}.",
    service: SettingsServiceEnum.NEWSLETTER,
    userAgent: "SYSTEM"
  },
  {
    key: SettingsKeyEnum.NEWSLETTER_SENDING_FROM,
    value: "Adrian <newsletter@adrian.com>",
    service: SettingsServiceEnum.NEWSLETTER,
    userAgent: "SYSTEM"
  },
  {
    key: SettingsKeyEnum.NEWSLETTER_COMPANY,
    value: "Adrian",
    service: SettingsServiceEnum.NEWSLETTER,
    userAgent: "SYSTEM"
  },
  {
    key: SettingsKeyEnum.NEWSLETTER_COMPANY_LOGO_LINK,
    value: "www.example.com/logo-link",
    service: SettingsServiceEnum.NEWSLETTER,
    userAgent: "SYSTEM"
  },
  {
    key: SettingsKeyEnum.NEWSLETTER_COPYRIGHT,
    value: "All rights reserved, {{company}} {{year}}©",
    service: SettingsServiceEnum.NEWSLETTER,
    userAgent: "SYSTEM"
  },
  {
    key: SettingsKeyEnum.NEWSLETTER_HOMEPAGE,
    value: "http://www.example.com",
    service: SettingsServiceEnum.NEWSLETTER,
    userAgent: "SYSTEM"
  },
  {
    key: SettingsKeyEnum.NEWSLETTER_ADDRESS,
    value: "example St., NY, USA",
    service: SettingsServiceEnum.NEWSLETTER,
    userAgent: "SYSTEM"
  },
];