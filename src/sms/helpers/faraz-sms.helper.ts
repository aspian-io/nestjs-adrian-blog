import { farazAuth, farazSMS } from "@aspianet/faraz-sms";
import { HttpService } from "@nestjs/axios";
import { BadRequestException } from "@nestjs/common";
import { I18nContext } from "nestjs-i18n";
import { SMSErrorsLocale } from "src/i18n/locale-keys/sms/errors.locale";

export class FarazSMSHelper {
  private static username: string;
  private static password: string;
  private static httpService: HttpService;
  private static readonly restEndPoint: string = 'https://ippanel.com/api/select';

  /**
   * Faraz SMS credentials init
   * @param username - Panel username
   * @param password - Panel Password
   */
  static init ( username: string, password: string, httpService: HttpService ) {
    this.username = username;
    this.password = password;
    this.httpService = httpService;
  }

  /**
   * Get remaining credit
   * @returns A promise of the type {@link IFarazSMSCredit}
   */
  static async getCredit ( i18n: I18nContext ): Promise<IFarazSMSCredit> {
    const dataToSend = {
      op: "credit",
      uname: this.username,
      pass: this.password,
    };
    try {
      const { data } = await this.httpService.axiosRef.post( this.restEndPoint, dataToSend );
      return { credit: Math.trunc( data[ 1 ] ) };
    } catch ( error ) {
      console.log( `Something went wrong getting SMS credit` );
      throw new BadRequestException( i18n.t( SMSErrorsLocale.GET_CREDIT ) );
    }
  }

  /**
  * Send SMS
   * @param originator - Originator line number
   * @param recipients - Recipients number
   * @param message - Message content
   * @returns void promise
   */
  static async send ( i18n: I18nContext, originator: string, recipients: string[], message: string ): Promise<void> {
    const dataToSend = {
      op: "send",
      uname: this.username,
      pass: this.password,
      message,
      from: originator,
      to: recipients
    };
    try {
      await this.httpService.axiosRef.post( this.restEndPoint, dataToSend );
    } catch ( error ) {
      console.log( `Something went wrong sending SMS` );
      throw new BadRequestException( i18n.t( SMSErrorsLocale.SEND_SMS ) );
    }
  }

  /**
   * Send SMS immediately by using approved pattern and the pattern code
   * @param pattern_code - Approved pattern's code
   * @param originator - Originator line number
   * @param recipient - Recipient line number
   * @param values - And object containing pattern's variables and their values
   * @returns void promise
   */
  static async sendByPatternCode<T> ( i18n: I18nContext, pattern_code: string, originator: string, recipient: string, values: T )
    : Promise<void> {
    const dataToSend = {
      op: "pattern",
      user: this.username,
      pass: this.password,
      fromNum: originator,
      toNum: recipient,
      patternCode: pattern_code,
      inputData: [
        values
      ]
    };
    try {
      await this.httpService.axiosRef.post( this.restEndPoint, dataToSend );
    } catch ( error ) {
      console.log( `Something went wrong sending patterned SMS` );
      throw new BadRequestException( i18n.t( SMSErrorsLocale.SEND_PATTERN_SMS ) );
    }
  }

  /**
   * Get list of phone books
   * @returns List of phone books
   */
  static async getPhoneBooksList ( i18n: I18nContext ): Promise<IPhoneBook[]> {
    const dataToSend = {
      op: "booklistV2",
      uname: this.username,
      pass: this.password,
    };
    try {
      const { data } = await this.httpService.axiosRef.post<IFarazSMSPhoneBooksListResult>( this.restEndPoint, dataToSend );
      if ( data.status.code !== 200 ) {
        console.log( `Something went wrong getting phone books list` );
        throw new BadRequestException( i18n.t( SMSErrorsLocale.GET_PHONE_BOOKS_LIST ) );
      }
      return data.data.phoneBook;
    } catch ( error ) {
      console.log( `Something went wrong getting phone books list` );
      throw new BadRequestException( i18n.t( SMSErrorsLocale.GET_PHONE_BOOKS_LIST ) );
    }
  }

  /**
   * Add a phone number to a Faraz SMS specific phone book
   * @param phoneBookId - Faraz SMS phone book Id
   * @param name - Name
   * @param lineNumber - Phone number
   * @returns A promise of the type {@link IFarazSMSAddNumberResult}
   */
  static async addLineNumberToPhoneBook ( i18n: I18nContext, phoneBookId: number, name: string, lineNumber: string ): Promise<IFarazSMSAddNumberResult> {
    const dataToSend = {
      op: "phoneBookAdd",
      uname: this.username,
      pass: this.password,
      phoneBookId,
      name,
      number: lineNumber
    };
    try {
      const { data } = await this.httpService.axiosRef.post<IFarazSMSAddNumberResult>( this.restEndPoint, dataToSend );
      if ( data.status.code !== 0 ) {
        console.log( `Something went wrong adding the phone number '${ lineNumber }' to Faraz SMS phone book '${ phoneBookId }'` );
        throw new BadRequestException( i18n.t( SMSErrorsLocale.ADD_NUMBER_TO_PHONE_BOOK ) );
      }
      return data;
    } catch ( error ) {
      console.log( `Something went wrong adding the phone number '${ lineNumber }' to Faraz SMS phone book '${ phoneBookId }'` );
      throw new BadRequestException( i18n.t( SMSErrorsLocale.ADD_NUMBER_TO_PHONE_BOOK ) );
    }
  }
}

// Types

// Response of credit
export interface IFarazSMSCredit {
  credit: number;
}

// Response data after adding a number to phone book
export interface IFarazSMSAddNumberResult {
  status: {
    code: number;
    errorMessage: string;
    level: number;
  };

  data: {
    result?: string;
  };
}

// Response data after getting phone books list
export interface IFarazSMSPhoneBooksListResult {
  status: {
    code: number;
    errorMessage: string;
    level: number;
  };

  data: {
    phoneBook: IPhoneBook[];
  };
}

export interface IPhoneBook {
  title: string;
  phoneBookId: number;
}