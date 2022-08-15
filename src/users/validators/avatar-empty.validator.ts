import { Injectable, FileValidator, BadRequestException } from '@nestjs/common';

@Injectable()
export class AvatarEmptyValidator extends FileValidator {
  constructor () {
    super( {} );
  }
  isValid ( file?: any ): boolean | Promise<boolean> {
    if ( !file ) throw new BadRequestException( "Please select a file before sending" );
    return true;
  }
  buildErrorMessage ( file: any ): string {
    if ( !file ) return "Please select a file before sending";
  }

}