import { NotFoundException } from "@nestjs/common";
import { I18nContext } from "nestjs-i18n";
import { CommonErrorsLocale } from "src/i18n/locale-keys/common/errors.locale";

export class NotFoundLocalizedException extends NotFoundException {
  constructor ( private i18n: I18nContext, term: string ) {
    super( i18n.t( CommonErrorsLocale.Not_Found, { args: { prop: i18n.t( term ) } } ) );
  }
}