import { BadRequestException, CACHE_MANAGER, ForbiddenException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IMetadataDecorator } from 'src/common/decorators/metadata.decorator';
import { Between, In, IsNull, Not, Raw, Repository } from 'typeorm';
import { AvatarSourceEnum, User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { IServiceUserLoginResult, IServiceUserRefreshTokensResult, IServiceUserRegisterResult, UserErrorsEnum, UserErrorsInternalCodeEnum } from './types/services.type';
import { I18nContext } from 'nestjs-i18n';
import { UsersInfoLocale } from 'src/i18n/locale-keys/users/info.locale';
import { NotFoundLocalizedException } from 'src/common/exceptions/not-found-localized.exception';
import { UsersErrorsLocal } from 'src/i18n/locale-keys/users/errors.locale';
import { PermissionsEnum } from 'src/common/security/permissions.enum';
import { Claim } from './entities/claim.entity';
import { Cache } from 'cache-manager';
import { EnvEnum } from 'src/env.enum';
import { FilterPaginationUtil, IListResultGenerator } from 'src/common/utils/filter-pagination.utils';
import { AdminUpdateUserDto, UserLoginDto, UsersListQueryDto, CreateUserDto } from './dto';
import { UpdateUserClaimsDto } from './dto/update-claims.dto';
import { InjectS3, S3 } from 'nestjs-s3';
import * as path from 'path';
import { sanitize } from 'string-sanitizer';
import { SettingsService } from 'src/settings/settings.service';
import { SettingsKeyEnum } from 'src/settings/types/settings-key.enum';
import { MailerService } from '@nestjs-modules/mailer';
import { PostsService } from 'src/posts/posts.service';
import * as Handlebars from 'handlebars';
import { SmsService } from '../sms/sms.service';
import { UserEmailDto } from './dto/user-email.dto';
import { UserResetPasswordByEmailDto } from './dto/reset-password-by-email.dto';
import { UserMobilePhoneDto } from './dto/user-mobile-phone.dto';
import { UserResetPasswordByMobileDto } from './dto/reset-password-by-mobile.dto';
import { UserChangePasswordDto } from './dto/change-password.dto';
import { UserLoginByMobilePhoneDto } from './dto/login-by-mobile.dto';
import { UserActivateEmailRegistrationDto } from './dto/activate-email-registration.dto';
import { CommonErrorsLocale } from 'src/i18n/locale-keys/common/errors.locale';
import { UserActivateMobileRegistrationDto } from './dto/activate-mobile-registration.dto';
import { UserRegisterByMobileDto } from './dto/register-by-mobile.dto';
import { LoginMethodsDto } from './dto/login-methods.dto';
import * as sanitizeHtml from 'sanitize-html';
import { OAuth2LoginRegisterDto } from './dto/oauth2-login-register.dto';
import * as passGenerator from 'generate-password';

@Injectable()
export class UsersService {
  constructor (
    @InjectRepository( User ) private readonly userRepository: Repository<User>,
    @InjectRepository( Claim ) private readonly claimRepository: Repository<Claim>,
    private readonly smsService: SmsService,
    private readonly settingsService: SettingsService,
    private readonly postsService: PostsService,
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    @InjectS3() private readonly s3: S3,
    @Inject( CACHE_MANAGER ) private cacheManager: Cache
  ) { }

  // Get login available Methods
  async getLoginMethods (): Promise<LoginMethodsDto> {
    const emailLogin = ( await this.settingsService.findOne( SettingsKeyEnum.USERS_LOGIN_BY_EMAIL ) ).value === "true";
    let mobileLogin = ( await this.settingsService.findOne( SettingsKeyEnum.USERS_LOGIN_BY_MOBILE_PHONE ) ).value === "true";
    const smsIsActive = this.configService.getOrThrow( EnvEnum.SMS_EQUIPPED ) === "true";
    if ( !smsIsActive ) mobileLogin = false;

    return { emailLogin, mobileLogin };
  }

  // OAth2 Login or Register
  async oAuth2LoginRegister ( i18n: I18nContext, oAuthLoginRegisterDto: OAuth2LoginRegisterDto, metadata: IMetadataDecorator ): Promise<IServiceUserLoginResult> {
    const user = await this.userRepository.findOne( { where: { email: oAuthLoginRegisterDto.username } } );
    if ( !user ) {
      const password = passGenerator.generate( { length: 10, numbers: true } );
      const userObj: CreateUserDto = { ...oAuthLoginRegisterDto, email: oAuthLoginRegisterDto.username, password };
      const newUser = await this.create( i18n, userObj, metadata, true );

      const accessToken = await this.generateAccessToken( newUser.id, newUser.email, newUser.claims?.map( c => c.name ) );
      const refreshToken = await this.generateRefreshToken( newUser.id, newUser.email );

      return {
        ...newUser,
        accessToken,
        refreshToken,
      };
    }

    if ( user.suspend && user.suspend.getTime() > Date.now() ) {
      throw new ForbiddenException( {
        statusCode: 403,
        internalCode: UserErrorsInternalCodeEnum.SUSPENDED_ACCOUNT,
        message: i18n.t( UsersErrorsLocal.USER_SUSPENDED ),
        error: UserErrorsEnum.SUSPENDED_ACCOUNT
      } );
    }
    const accessToken = await this.generateAccessToken( user.id, user.email, user.claims?.map( c => c.name ) );
    const refreshToken = await this.generateRefreshToken( user.id, user.email );

    return {
      ...user,
      accessToken,
      refreshToken
    };
  }

  // Login Service (Local JWT)
  async loginByEmail ( i18n: I18nContext, userLoginDto: UserLoginDto ): Promise<IServiceUserLoginResult> {
    const user = await this.userRepository.findOne( {
      where: { email: userLoginDto.username },
      relations: {
        claims: true,
      }
    } );
    if ( !user ) throw new UnauthorizedException( i18n.t( UsersErrorsLocal.INCORRECT_CREDENTIALS ) );

    const passwordMatch = await bcrypt.compare( userLoginDto.password, user.password );
    if ( !passwordMatch ) throw new UnauthorizedException( i18n.t( UsersErrorsLocal.INCORRECT_CREDENTIALS ) );

    if ( user.suspend && user.suspend.getTime() > Date.now() ) {
      throw new ForbiddenException( {
        statusCode: 403,
        internalCode: UserErrorsInternalCodeEnum.SUSPENDED_ACCOUNT,
        message: i18n.t( UsersErrorsLocal.USER_SUSPENDED ),
        error: UserErrorsEnum.SUSPENDED_ACCOUNT
      } );
    }

    if ( !user.isActivated ) {
      if ( user.emailVerificationTokenExpiresAt.getTime() > Date.now() ) {
        throw new ForbiddenException( {
          statusCode: 403,
          internalCode: UserErrorsInternalCodeEnum.INACTIVE_ACCOUNT,
          message: i18n.t( UsersErrorsLocal.ACCOUNT_ACTIVATION_BY_EMAIL ),
          error: UserErrorsEnum.INACTIVE_ACCOUNT
        } );
      }

      await this.verifyEmailReq( i18n, user.id );
      throw new ForbiddenException( {
        statusCode: 403,
        internalCode: UserErrorsInternalCodeEnum.INACTIVE_ACCOUNT,
        message: i18n.t( UsersErrorsLocal.ACCOUNT_ACTIVATION_BY_EMAIL ),
        error: UserErrorsEnum.INACTIVE_ACCOUNT
      } );
    }

    const accessToken = await this.generateAccessToken( user.id, user.email, user.claims.map( c => c.name ) );
    const refreshToken = await this.generateRefreshToken( user.id, user.email );

    return {
      ...user,
      accessToken,
      refreshToken
    };
  }

  // Login By Mobile Phone Request
  async loginByMobilePhoneReq ( i18n: I18nContext, mobilePhoneDto: UserMobilePhoneDto ): Promise<User> {
    const { mobilePhone } = mobilePhoneDto;
    const user = await this.userRepository.findOne( {
      where: { mobilePhone }
    } );
    if ( !user ) throw new NotFoundLocalizedException( i18n, UsersInfoLocale.TERM_USER );

    if ( user.suspend && user.suspend.getTime() > Date.now() ) {
      throw new ForbiddenException( {
        statusCode: 403,
        internalCode: UserErrorsInternalCodeEnum.SUSPENDED_ACCOUNT,
        message: i18n.t( UsersErrorsLocal.USER_SUSPENDED ),
        error: UserErrorsEnum.SUSPENDED_ACCOUNT
      } );
    }

    if ( user.mobilePhoneVerificationTokenExpiresAt.getTime() > Date.now() ) {
      const remainingTime = Math.trunc( ( user.mobilePhoneVerificationTokenExpiresAt.getTime() - Date.now() ) / 1000 );
      throw new BadRequestException( i18n.t( UsersErrorsLocal.MOBILE_PHONE_VERIFICATION_CODE_LIMIT, { args: { time: remainingTime } } ) );
    }

    const expTimeInMins = +( await this.settingsService.findOne( SettingsKeyEnum.USERS_MOBILE_TOKEN_EXP_IN_MINS ) ).value ?? 2;

    user.mobilePhoneVerificationToken = this.sixDigitTokenGenerator();
    user.mobilePhoneVerificationTokenExpiresAt = new Date( Date.now() + ( expTimeInMins * 60_000 ) );

    const result = await this.userRepository.save( user );
    await this.cacheManager.reset();

    const patternCode = ( await this.settingsService.findOne( SettingsKeyEnum.USERS_MOBILE_VERIFICATION_SMS_PATTERN_CODE ) ).value;
    const defaultOriginator = ( await this.settingsService.findOne( SettingsKeyEnum.SMS_DEFAULT_ORIGINATOR ) ).value;
    await this.smsService.sendByPattern(
      i18n,
      patternCode,
      defaultOriginator,
      user.mobilePhone,
      {
        name: user.firstName,
        verificationCode: result.mobilePhoneVerificationToken
      }
    );

    return result;
  }

  async loginByMobilePhone (
    loginByMobilePhoneDto: UserLoginByMobilePhoneDto,
    i18n: I18nContext
  ): Promise<IServiceUserLoginResult> {
    const { token, mobilePhone } = loginByMobilePhoneDto;
    const user = await this.userRepository.findOne( {
      where: { mobilePhone },
      relations: {
        claims: true
      }
    } );
    if ( !user ) throw new UnauthorizedException( i18n.t( UsersErrorsLocal.INCORRECT_CREDENTIALS ) );
    if ( user.mobilePhoneVerificationToken !== token || user.isMobilePhoneVerificationTokenExpired ) {
      throw new BadRequestException( i18n.t( UsersErrorsLocal.INVALID_EXPIRED_TOKEN ) );
    }

    if ( !user.mobilePhoneVerified || !user.isActivated ) {
      user.mobilePhoneVerified = true;
      user.isActivated = true;
    }

    user.mobilePhoneVerificationTokenExpiresAt = new Date( Date.now() - 24 * 60 * 60 * 1000 );
    await this.userRepository.save( user );

    const accessToken = await this.generateAccessToken( user.id, user.email, user.claims.map( c => c.name ) );
    const refreshToken = await this.generateRefreshToken( user.id, user.email );

    return {
      ...user,
      accessToken,
      refreshToken
    };
  }

  // Register Service (Local JWT) By Email
  async registerByEmail ( i18n: I18nContext, createUserDto: CreateUserDto, metadata: IMetadataDecorator ) {
    if ( this.configService.getOrThrow( EnvEnum.AUTH_REGISTER_BY ) !== "email" ) {
      throw new NotFoundLocalizedException( i18n, CommonErrorsLocale.TERMS_SERVICE );
    }
    return this.create( i18n, createUserDto, metadata );
  }

  // Activate email registration
  async activateEmailRegistration ( dto: UserActivateEmailRegistrationDto, i18n: I18nContext ): Promise<IServiceUserRegisterResult> {
    if ( this.configService.getOrThrow( EnvEnum.AUTH_REGISTER_BY ) !== "email" ) {
      throw new NotFoundLocalizedException( i18n, CommonErrorsLocale.TERMS_SERVICE );
    }
    const user = await this.userRepository.findOne( {
      where: { email: dto.email }
    } );
    if ( !user ) throw new NotFoundLocalizedException( i18n, UsersInfoLocale.TERM_USER );
    if ( dto.token !== user.emailVerificationToken ) {
      throw new BadRequestException( i18n.t( UsersErrorsLocal.INVALID_EXPIRED_TOKEN ) );
    }

    user.emailVerified = true;
    user.emailVerificationTokenExpiresAt = new Date( Date.now() - 24 * 60 * 60 * 1000 );
    user.isActivated = true;
    const result = await this.userRepository.save( user );
    await this.cacheManager.reset();

    const accessToken = await this.generateAccessToken( result.id, result.email, [] );
    const refreshToken = await this.generateRefreshToken( result.id, result.email );

    return {
      ...user,
      accessToken,
      refreshToken
    };
  }

  // Get verification email token remaining time in seconds
  async getEmailTokenRemainingTimeInSec ( i18n: I18nContext, email: string ) {
    const user = await this.userRepository.findOne( { where: { email } } );
    if ( !user ) throw new NotFoundLocalizedException( i18n, UsersInfoLocale.TERM_USER );
    let remainingTimeInSec = 0;

    if ( !user.isActivated ) {
      if ( user.emailVerificationTokenExpiresAt.getTime() > Date.now() ) {
        remainingTimeInSec = Math.floor( ( user.emailVerificationTokenExpiresAt.getTime() - Date.now() ) / 1000 );
        return { remainingTimeInSec };
      }

      return { remainingTimeInSec: 0 };
    }

    throw new ForbiddenException( { statusCode: 403, message: i18n.t( UsersErrorsLocal.EMAIL_ALREADY_VERIFIED ), error: 'Already Verified' } );
  }

  // Resend verification token email
  async resendVerificationTokenEmail ( i18n: I18nContext, email: string ) {
    if ( this.configService.getOrThrow( EnvEnum.AUTH_REGISTER_BY ) !== "email" ) {
      throw new NotFoundLocalizedException( i18n, CommonErrorsLocale.TERMS_SERVICE );
    }

    const user = await this.userRepository.findOne( { where: { email } } );
    if ( !user ) throw new NotFoundLocalizedException( i18n, UsersInfoLocale.TERM_USER );

    if ( !user.isActivated ) {
      if ( user.emailVerificationTokenExpiresAt.getTime() > Date.now() ) {
        const emailTokenExpInSec = Math.floor( ( user.emailVerificationTokenExpiresAt.getTime() - Date.now() ) / 1000 );
        throw new BadRequestException( { statusCode: 400, message: i18n.t( UsersErrorsLocal.EMAIL_PHONE_VERIFICATION_CODE_LIMIT ), error: 'Bad Request', emailTokenExpInSec } );
      }

      await this.verifyEmailReq( i18n, user.id );
      const emailTokenExpInSec = +( ( await this.settingsService.findOne( SettingsKeyEnum.USERS_EMAIL_TOKEN_EXP_IN_MINS ) ).value ) * 60;
      return { ...user, emailTokenExpInSec };
    }

    throw new ForbiddenException( i18n.t( UsersErrorsLocal.EMAIL_ALREADY_VERIFIED ) );
  }

  // Register Service (Local JWT) By mobile phone
  registerByMobilePhone ( i18n: I18nContext, registerBySMSDto: UserRegisterByMobileDto, metadata: IMetadataDecorator ): Promise<User> {
    if ( this.configService.getOrThrow( EnvEnum.AUTH_REGISTER_BY ) !== "mobile" ) {
      throw new NotFoundLocalizedException( i18n, CommonErrorsLocale.TERMS_SERVICE );
    }
    return this.create( i18n, registerBySMSDto, metadata );
  }

  // Activate mobile phone registration
  async activateMobilePhoneRegistration ( dto: UserActivateMobileRegistrationDto, i18n: I18nContext ): Promise<IServiceUserRegisterResult> {
    if ( this.configService.getOrThrow( EnvEnum.AUTH_REGISTER_BY ) !== "mobile" ) {
      throw new NotFoundLocalizedException( i18n, CommonErrorsLocale.TERMS_SERVICE );
    }
    const user = await this.userRepository.findOne( {
      where: { mobilePhone: dto.mobilePhone }
    } );
    if ( !user ) throw new NotFoundLocalizedException( i18n, UsersInfoLocale.TERM_USER );
    if ( user.mobilePhoneVerified ) {
      throw new BadRequestException( i18n.t( UsersErrorsLocal.MOBILE_ALREADY_VERIFIED ) );
    }
    if ( dto.token !== user.mobilePhoneVerificationToken || user.isMobilePhoneVerificationTokenExpired ) {
      throw new BadRequestException( i18n.t( UsersErrorsLocal.INVALID_EXPIRED_TOKEN ) );
    }

    user.mobilePhoneVerified = true;
    user.mobilePhoneVerificationTokenExpiresAt = new Date( Date.now() - 24 * 60 * 60 * 1000 );
    user.isActivated = true;
    const result = await this.userRepository.save( user );
    await this.cacheManager.reset();

    const accessToken = await this.generateAccessToken( result.id, result.email, [] );
    const refreshToken = await this.generateRefreshToken( result.id, result.email );

    return {
      ...user,
      accessToken,
      refreshToken
    };
  }

  // Create a new user
  async create ( i18n: I18nContext, dto: CreateUserDto | UserRegisterByMobileDto, metadata: IMetadataDecorator, oAuth2: boolean = false ): Promise<User> {
    const { ipAddress, userAgent } = metadata;
    if ( this.configService.getOrThrow( EnvEnum.AUTH_REGISTER_BY ) === "email" ) {
      const registerByEmailDto = dto as CreateUserDto;

      const existingUser = await this.userRepository.findOne( { where: { email: registerByEmailDto.email } } );
      if ( existingUser ) {
        throw new BadRequestException( i18n.t( UsersErrorsLocal.EMAIL_IN_USE ) );
      }
      // Check if the new mobile phone is in use
      if ( registerByEmailDto.mobilePhone ) {
        const duplicateMobilePhone = await this.userRepository.findOne( { where: { mobilePhone: registerByEmailDto.mobilePhone } } );
        if ( duplicateMobilePhone ) throw new BadRequestException( i18n.t( UsersErrorsLocal.MOBILE_PHONE_IN_USE ) );
      }
      // Hashing password
      const hash = await this.hash( registerByEmailDto.password );

      const user = this.userRepository.create( {
        ...registerByEmailDto,
        password: hash, // replace hashed password
        ipAddress,
        userAgent,
        emailVerified: oAuth2,
        isActivated: oAuth2,
        avatarSource: oAuth2 ? AvatarSourceEnum.OAUTH2 : AvatarSourceEnum.STORAGE,
        claims: []
      } );

      await this.cacheManager.reset();
      const result = await this.userRepository.save( user );

      if ( !oAuth2 ) await this.verifyEmailReq( i18n, result.id );

      return result;
    }

    if ( this.configService.getOrThrow( EnvEnum.AUTH_REGISTER_BY ) === "mobile" ) {
      const registerBySMSDto = dto as UserRegisterByMobileDto;

      const existingUser = await this.userRepository.findOne( { where: { mobilePhone: registerBySMSDto.mobilePhone } } );
      if ( existingUser ) {
        throw new BadRequestException( i18n.t( UsersErrorsLocal.MOBILE_PHONE_IN_USE ) );
      }
      // Check if new mobile phone is in use
      if ( registerBySMSDto.email ) {
        const duplicateEmail = await this.userRepository.findOne( { where: { email: registerBySMSDto.email } } );
        if ( duplicateEmail ) throw new BadRequestException( i18n.t( UsersErrorsLocal.EMAIL_IN_USE ) );
      }

      // Hashing password
      const hash = await this.hash( registerBySMSDto.password );

      const user = this.userRepository.create( {
        ...registerBySMSDto,
        password: hash, // replace hashed password
        ipAddress,
        userAgent,
        claims: []
      } );

      await this.cacheManager.reset();
      const result = await this.userRepository.save( user );

      await this.verifyMobilePhoneReq( i18n, result.id );

      return result;
    }

  }

  // Refresh access and refresh tokens
  async refreshTokens ( refreshToken: string ): Promise<IServiceUserRefreshTokensResult> {
    try {
      const decodedRt = await this.jwtService.verifyAsync( refreshToken, { secret: this.configService.getOrThrow( EnvEnum.AUTH_REFRESH_TOKEN_SECRET ) } );
      const user = await this.userRepository.findOne( {
        where: { id: decodedRt[ 'sub' ] },
        relations: {
          claims: true,
        }
      } );

      if ( !user ) throw new ForbiddenException();
      if ( user.suspend && user.suspend.getTime() > Date.now() ) {
        throw new ForbiddenException();
      }
      const accessToken = await this.generateAccessToken( user.id, user.email, user.claims.map( c => c.name ) );
      const newRefreshToken = await this.generateRefreshToken( user.id, user.email );
      return {
        ...user,
        accessToken,
        refreshToken: newRefreshToken
      };
    } catch ( error ) {
      throw new ForbiddenException();
    }
  }

  // Find all with verified emails
  findAllWithVerifiedEmails () {
    return this.userRepository.find( {
      where: {
        email: Not( IsNull() ),
        emailVerified: true
      }
    } );
  }

  // Find all users
  async findAll ( query: UsersListQueryDto ): Promise<IListResultGenerator<User>> {
    const { page, limit } = query;
    const { skip, take } = FilterPaginationUtil.takeSkipGenerator( limit, page );

    // Get the result from database
    const [ items, totalItems ] = await this.userRepository.findAndCount( {
      relations: {
        claims: true
      },
      where: {
        email: query[ 'searchBy.email' ],
        address: query[ 'searchBy.address' ],
        phone: query[ 'searchBy.phone' ],
        mobilePhone: query[ 'searchBy.mobilePhone' ],
        postalCode: query[ 'searchBy.postalCode' ],
        suspend: query[ 'filterBy.suspended' ] ? Raw( ( alias ) => `${ alias } > NOW()` ) : undefined,
        birthDate: query[ 'filterBy.birthDate' ]?.length
          ? Between( query[ 'filterBy.birthDate' ][ 0 ], query[ 'filterBy.birthDate' ][ 1 ] )
          : undefined,
        createdAt: query[ 'filterBy.createdAt' ]?.length
          ? Between( query[ 'filterBy.createdAt' ][ 0 ], query[ 'filterBy.createdAt' ][ 1 ] )
          : undefined,
        updatedAt: query[ 'filterBy.updatedAt' ]?.length
          ? Between( query[ 'filterBy.updatedAt' ][ 0 ], query[ 'filterBy.updatedAt' ][ 1 ] )
          : undefined,
        firstName: query[ 'searchBy.firstName' ],
        lastName: query[ 'searchBy.lastName' ],
        bio: query[ 'searchBy.bio' ],
        claims: {
          name: query[ 'filterBy.claims' ]?.length ? In( query[ 'filterBy.claims' ] ) : undefined
        }
      },
      order: {
        email: query[ 'orderBy.email' ],
        birthDate: query[ 'orderBy.birthDate' ],
        country: query[ 'orderBy.country' ],
        state: query[ 'orderBy.state' ],
        city: query[ 'orderBy.city' ],
        address: query[ 'orderBy.address' ],
        phone: query[ 'orderBy.phone' ],
        mobilePhone: query[ 'orderBy.mobilePhone' ],
        postalCode: query[ 'orderBy.postalCode' ],
        createdAt: query[ 'orderBy.createdAt' ],
        updatedAt: query[ 'orderBy.updatedAt' ],
        suspend: query[ 'orderBy.suspend' ],
        ipAddress: query[ 'orderBy.ipAddress' ],
        userAgent: query[ 'orderBy.userAgent' ],
        firstName: query[ 'orderBy.firstName' ],
        lastName: query[ 'orderBy.lastName' ],
        bio: query[ 'orderBy.bio' ]
      },
      take,
      skip
    } );

    return FilterPaginationUtil.resultGenerator( items, totalItems, limit, page );
  }

  // Find one user
  async findOne ( id: string, i18n: I18nContext ): Promise<User> {
    const user = await this.userRepository.findOne( { where: { id }, relations: { claims: true } } );
    if ( !user ) throw new NotFoundLocalizedException( i18n, UsersInfoLocale.TERM_USER );
    return user;
  }

  // Check if the user is Admin
  async isUserAdmin ( id: string ) {
    const adminClaim = await this.claimRepository.findOne( { where: { name: PermissionsEnum.ADMIN } } );
    const isUserAdmin = await this.userRepository.findOne( { relations: { claims: true }, where: { id, claims: { id: adminClaim.id } } } );
    return !!isUserAdmin;
  }

  // Check to see if user is the only admin
  async isOnlyAdmin ( id: string ) {
    const adminClaim = await this.claimRepository.findOne( { where: { name: PermissionsEnum.ADMIN } } );
    const isUserAdmin = await this.userRepository.findOne( { relations: { claims: true }, where: { id, claims: { id: adminClaim.id } } } );
    const adminCount = await this.userRepository.count( { relations: { claims: true }, where: { claims: { id: adminClaim.id } } } );
    return !!isUserAdmin && adminCount <= 1;
  }

  // Update user's info
  async update ( i18n: I18nContext, id: string, userBody: AdminUpdateUserDto, logData: IMetadataDecorator, sanitizeBio: boolean = false ): Promise<User> {

    const user = await this.findOne( id, i18n );
    // The only admin cannot be suspended
    const isUserAdmin = await this.isUserAdmin( user.id );
    if ( isUserAdmin && userBody.suspend.getTime() >= Date.now() ) {
      throw new BadRequestException( i18n.t( UsersErrorsLocal.ADMIN_SUSPEND ) );
    }
    // Check if new email address is in use
    if ( userBody.email && userBody.email !== user.email ) {
      const duplicateEmail = await this.userRepository.findOne( { where: { id: Not( id ), email: userBody.email } } );
      if ( duplicateEmail ) throw new BadRequestException( i18n.t( UsersErrorsLocal.EMAIL_IN_USE ) );
      user.emailVerified = false;
    }

    // Check if new mobile phone is in use
    if ( userBody.mobilePhone && userBody.mobilePhone !== user.mobilePhone ) {
      const duplicateMobilePhone = await this.userRepository.findOne( { where: { id: Not( id ), mobilePhone: userBody.mobilePhone } } );
      if ( duplicateMobilePhone ) throw new BadRequestException( i18n.t( UsersErrorsLocal.MOBILE_PHONE_IN_USE ) );
      user.mobilePhoneVerified = false;
    }

    // Hash new password
    userBody.password = userBody?.password ? await this.hash( userBody.password ) : undefined;

    Object.assign( user, userBody );
    user.ipAddress = logData.ipAddress;
    user.userAgent = logData.userAgent;
    if ( userBody?.bio && sanitizeBio ) user.bio = await this.bioSanitizer( userBody.bio );

    await this.cacheManager.reset();
    return this.userRepository.save( user );
  }

  // Update mobile phone number request
  async updateMobilePhoneReq ( mobilePhone: string, i18n: I18nContext, metadata: IMetadataDecorator ) {
    const user = await this.findOne( metadata.user.id, i18n );

    if ( mobilePhone === user.mobilePhone ) return user;

    const duplicate = await this.userRepository.findOne( {
      where: {
        id: Not( user.id ),
        mobilePhone
      }
    } );
    if ( duplicate ) throw new BadRequestException( i18n.t( UsersErrorsLocal.MOBILE_PHONE_IN_USE ) );

    user.mobilePhoneTemp = mobilePhone;

    if ( user.mobilePhoneVerificationTokenExpiresAt.getTime() > Date.now() ) {
      const remainingTime = Math.trunc( ( user.mobilePhoneVerificationTokenExpiresAt.getTime() - Date.now() ) / 1000 );
      throw new BadRequestException( i18n.t( UsersErrorsLocal.MOBILE_PHONE_VERIFICATION_CODE_LIMIT, { args: { time: remainingTime } } ) );
    }

    const expTimeInMins = +( await this.settingsService.findOne( SettingsKeyEnum.USERS_MOBILE_TOKEN_EXP_IN_MINS ) ).value ?? 2;

    user.mobilePhoneVerificationToken = this.sixDigitTokenGenerator();
    user.mobilePhoneVerificationTokenExpiresAt = new Date( Date.now() + ( expTimeInMins * 60_000 ) );

    const result = await this.userRepository.save( user );
    await this.cacheManager.reset();

    const patternCode = ( await this.settingsService.findOne( SettingsKeyEnum.USERS_MOBILE_VERIFICATION_SMS_PATTERN_CODE ) ).value;
    const defaultOriginator = ( await this.settingsService.findOne( SettingsKeyEnum.SMS_DEFAULT_ORIGINATOR ) ).value;
    await this.smsService.sendByPattern(
      i18n,
      patternCode,
      defaultOriginator,
      user.mobilePhoneTemp,
      {
        name: user.firstName,
        verificationCode: result.mobilePhoneVerificationToken
      }
    );

    return result;
  }

  // Update mobile phone
  async updateMobilePhone ( userId: string, token: number, i18n: I18nContext ) {
    const user = await this.findOne( userId, i18n );
    if ( user.mobilePhoneVerificationToken !== token || user.isMobilePhoneVerificationTokenExpired ) {
      throw new BadRequestException( i18n.t( UsersErrorsLocal.INVALID_EXPIRED_TOKEN ) );
    }

    const duplicate = await this.userRepository.findOne( {
      where: {
        id: Not( user.id ),
        mobilePhone: user.mobilePhoneTemp
      }
    } );
    if ( duplicate ) throw new BadRequestException( i18n.t( UsersErrorsLocal.MOBILE_PHONE_IN_USE ) );

    user.mobilePhoneVerified = true;
    user.mobilePhoneVerificationTokenExpiresAt = new Date( Date.now() - 24 * 60 * 60 * 1000 );
    user.isActivated = true;
    user.mobilePhone = user.mobilePhoneTemp;
    user.mobilePhoneTemp = null;
    const result = await this.userRepository.save( user );
    await this.cacheManager.reset();

    return result;
  }

  // Email Verification Request
  async verifyEmailReq ( i18n: I18nContext, userId: string ) {
    const user = await this.findOne( userId, i18n );
    if ( user.emailVerified ) {
      throw new BadRequestException( i18n.t( UsersErrorsLocal.EMAIL_ALREADY_VERIFIED ) );
    }

    if ( user.emailVerificationTokenExpiresAt.getTime() > Date.now() ) {
      const remainingTime = Math.trunc( ( user.emailVerificationTokenExpiresAt.getTime() - Date.now() ) / 1000 );
      throw new BadRequestException( i18n.t( UsersErrorsLocal.EMAIL_PHONE_VERIFICATION_CODE_LIMIT, { args: { time: remainingTime } } ) );
    }

    const expTimeInMins = +( await this.settingsService.findOne( SettingsKeyEnum.USERS_EMAIL_TOKEN_EXP_IN_MINS ) ).value ?? 20;

    user.emailVerificationToken = this.sixDigitTokenGenerator();
    user.emailVerificationTokenExpiresAt = new Date( Date.now() + ( expTimeInMins * 60_000 ) );

    const result = await this.userRepository.save( user );
    await this.cacheManager.reset();

    const defaultTemplatePath = path.join( __dirname, './templates/email-verification.template.hbs' );
    const customTemplateId = ( await this.settingsService.findOneOrNull( SettingsKeyEnum.USERS_EMAIL_VERIFICATION_TEMPLATE_ID ) )?.value;
    const customTemplate = customTemplateId ? await this.postsService.findOne( customTemplateId ) : null;
    const websiteName = ( await this.settingsService.findOne( SettingsKeyEnum.SITE_NAME ) ).value;
    const websiteUrl = ( await this.settingsService.findOne( SettingsKeyEnum.SITE_URL ) ).value;
    const subject = ( await this.settingsService.findOne( SettingsKeyEnum.USERS_EMAIL_VERIFICATION_SUBJECT ) ).value;
    const siteSupportEmail = ( await this.settingsService.findOne( SettingsKeyEnum.SITE_SUPPORT_EMAIL ) ).value;

    if ( customTemplate ) {
      const compiledTemplate = Handlebars.compile( customTemplate );
      const html = compiledTemplate( {
        websiteName,
        token: result.emailVerificationToken,
        websiteUrl
      } );
      return this.mailerService.sendMail( {
        from: siteSupportEmail,
        to: result.email,
        subject,
        html,
      } );
    }

    return this.mailerService.sendMail( {
      from: siteSupportEmail,
      to: result.email,
      subject,
      template: defaultTemplatePath,
      context: { websiteName, token: result.emailVerificationToken, websiteUrl }
    } );
  }

  // Email Verification
  async verifyEmail ( i18n: I18nContext, userId: string, token: number ): Promise<User> {
    const user = await this.findOne( userId, i18n );
    if ( user.emailVerificationToken !== token || user.isEmailVerificationTokenExpired ) {
      throw new BadRequestException( i18n.t( UsersErrorsLocal.INVALID_EXPIRED_TOKEN ) );
    }

    user.emailVerified = true;
    user.emailVerificationTokenExpiresAt = new Date( Date.now() - 24 * 60 * 60 * 1000 );
    user.isActivated = true;
    const result = await this.userRepository.save( user );
    await this.cacheManager.reset();

    return result;
  }

  // Mobile Phone Verification Request
  async verifyMobilePhoneReq ( i18n: I18nContext, userId: string ): Promise<User> {
    const user = await this.findOne( userId, i18n );
    if ( !user?.mobilePhone?.length ) {
      throw new BadRequestException( i18n.t( UsersErrorsLocal.MOBILE_PHONE_IS_EMPTY ) );
    }
    if ( user.mobilePhoneVerified ) {
      throw new BadRequestException( i18n.t( UsersErrorsLocal.MOBILE_ALREADY_VERIFIED ) );
    }

    if ( user.mobilePhoneVerificationTokenExpiresAt.getTime() > Date.now() ) {
      const remainingTime = Math.trunc( ( user.mobilePhoneVerificationTokenExpiresAt.getTime() - Date.now() ) / 1000 );
      throw new BadRequestException( i18n.t( UsersErrorsLocal.MOBILE_PHONE_VERIFICATION_CODE_LIMIT, { args: { time: remainingTime } } ) );
    }

    const expTimeInMins = +( await this.settingsService.findOne( SettingsKeyEnum.USERS_MOBILE_TOKEN_EXP_IN_MINS ) ).value ?? 2;

    user.mobilePhoneVerificationToken = this.sixDigitTokenGenerator();
    user.mobilePhoneVerificationTokenExpiresAt = new Date( Date.now() + ( expTimeInMins * 60_000 ) );

    const result = await this.userRepository.save( user );
    await this.cacheManager.reset();

    const patternCode = ( await this.settingsService.findOne( SettingsKeyEnum.USERS_MOBILE_VERIFICATION_SMS_PATTERN_CODE ) ).value;
    const defaultOriginator = ( await this.settingsService.findOne( SettingsKeyEnum.SMS_DEFAULT_ORIGINATOR ) ).value;
    await this.smsService.sendByPattern(
      i18n,
      patternCode,
      defaultOriginator,
      user.mobilePhone,
      {
        name: user.firstName,
        verificationCode: result.mobilePhoneVerificationToken
      }
    );

    return result;
  }

  // Verify Mobile Phone
  async verifyMobilePhone ( i18n: I18nContext, userId: string, token: number ): Promise<User> {
    const user = await this.findOne( userId, i18n );
    if ( user.mobilePhoneVerificationToken !== token || user.isMobilePhoneVerificationTokenExpired ) {
      throw new BadRequestException( i18n.t( UsersErrorsLocal.INVALID_EXPIRED_TOKEN ) );
    }

    user.mobilePhoneVerified = true;
    user.mobilePhoneVerificationTokenExpiresAt = new Date( Date.now() - 24 * 60 * 60 * 1000 );
    user.isActivated = true;
    const result = await this.userRepository.save( user );
    await this.cacheManager.reset();

    return result;
  }

  // Edit Avatar
  async updateAvatar ( avatar: Express.Multer.File, i18n: I18nContext, metadata: IMetadataDecorator, userId?: string ): Promise<User> {
    const user = await this.findOne( userId ? userId : metadata.user.id, i18n );
    if ( !avatar?.size ) throw new BadRequestException( i18n.t( UsersErrorsLocal.NO_AVATAR ) );
    if ( user?.avatar?.length && user.avatarSource !== AvatarSourceEnum.OAUTH2 ) {
      try {
        await this.s3.deleteObject( {
          Bucket: this.configService.getOrThrow( EnvEnum.S3_PROFILE_BUCKET ),
          Key: user.avatar
        } ).promise();
        await this.userRepository.save( user );
      } catch ( err ) { }
    }
    const avatarS3Key = this.generateAvatarS3Key( avatar.originalname, user.id );
    await this.s3.upload( {
      Bucket: this.configService.getOrThrow( EnvEnum.S3_PROFILE_BUCKET ),
      Key: avatarS3Key,
      Body: avatar.buffer,
      ContentType: avatar.mimetype,
      ACL: "public-read",
    } ).promise();
    user.avatar = avatarS3Key;
    user.ipAddress = metadata.ipAddress;
    user.userAgent = metadata.userAgent;
    const updatedUser = await this.userRepository.save( user );
    await this.cacheManager.reset();
    return updatedUser;
  }

  // Remove Avatar
  async removeAvatar ( i18n: I18nContext, metadata: IMetadataDecorator, userId?: string ): Promise<User> {
    const user = await this.findOne( userId ? userId : metadata.user.id, i18n );
    if ( user?.avatar?.length ) {
      if ( user.avatarSource !== AvatarSourceEnum.OAUTH2 ) {
        try {
          await this.s3.deleteObject( {
            Bucket: this.configService.getOrThrow( EnvEnum.S3_PROFILE_BUCKET ),
            Key: user.avatar
          } ).promise();
          await this.userRepository.save( user );
        } catch ( err ) { }

        user.avatar = null;
        const result = await this.userRepository.save( user );
        await this.cacheManager.reset();

        return result;
      }
      user.avatar = null;
      const result = await this.userRepository.save( user );
      await this.cacheManager.reset();

      return result;
    }

    return user;
  }

  // Update user claims
  async updateUserClaims ( userId: string, body: UpdateUserClaimsDto, i18n: I18nContext ): Promise<User> {
    const user = await this.findOne( userId, i18n );
    if ( user.claims?.length ) {
      // Check for the only admin claim not to be removed
      const adminClaim = await this.claimRepository.findOne( { where: { name: PermissionsEnum.ADMIN } } );
      const isUserAdmin = await this.userRepository.findOne( { relations: { claims: true }, where: { id: user.id, claims: { id: adminClaim.id } } } );
      const adminCount = await this.userRepository.count( { relations: { claims: true }, where: { claims: { id: adminClaim.id } } } );
      if ( adminCount <= 1 && isUserAdmin && !body.claimIds.includes( adminClaim.id ) ) {
        throw new BadRequestException( i18n.t( UsersErrorsLocal.ONLY_ADMIN ) );
      }
    }

    const claims = await this.claimRepository.find( { where: { id: In( body.claimIds ) } } );
    user.claims = claims;
    const result = await this.userRepository.save( user );
    await this.cacheManager.reset();
    return result;
  }

  // Change Password
  async changePassword ( id: string, changePasswordDto: UserChangePasswordDto, i18n: I18nContext ): Promise<User> {
    const { currentPassword, password } = changePasswordDto;
    const user = await this.findOne( id, i18n );
    // Check old password
    const passwordMatch = await bcrypt.compare( currentPassword, user.password );
    if ( !passwordMatch ) throw new BadRequestException( i18n.t( UsersErrorsLocal.CURRENT_PASSWORD_NOT_MATCH ) );
    // Hashing password
    const hash = await this.hash( password );
    user.password = hash;

    const result = await this.userRepository.save( user );
    await this.cacheManager.reset();

    const defaultTemplatePath = path.join( __dirname, './templates/change-password.template.hbs' );
    const customTemplateId = ( await this.settingsService.findOneOrNull( SettingsKeyEnum.USERS_EMAIL_CHANGE_PASSWORD_TEMPLATE_ID ) )?.value;
    const customTemplate = customTemplateId ? await this.postsService.findOne( customTemplateId ) : null;
    const websiteName = ( await this.settingsService.findOne( SettingsKeyEnum.SITE_NAME ) ).value;
    const websiteUrl = ( await this.settingsService.findOne( SettingsKeyEnum.SITE_URL ) ).value;
    const subject = ( await this.settingsService.findOne( SettingsKeyEnum.USERS_EMAIL_CHANGE_PASSWORD_SUBJECT ) ).value;
    const siteSupportEmail = ( await this.settingsService.findOne( SettingsKeyEnum.SITE_SUPPORT_EMAIL ) ).value;

    if ( customTemplate ) {
      const compiledTemplate = Handlebars.compile( customTemplate );
      const html = compiledTemplate( {
        websiteName,
        websiteUrl
      } );
      await this.mailerService.sendMail( {
        from: siteSupportEmail,
        to: result.email,
        subject,
        html,
      } );

      return result;
    }

    await this.mailerService.sendMail( {
      from: siteSupportEmail,
      to: result.email,
      subject,
      template: defaultTemplatePath,
      context: { websiteName, token: result.emailVerificationToken, websiteUrl }
    } );

    return result;
  }

  // Reset password by email
  async resetPasswordByEmailReq ( userEmailDto: UserEmailDto, i18n: I18nContext ) {
    const { email } = userEmailDto;
    const user = await this.userRepository.findOne( {
      where: { email }
    } );
    if ( !user ) throw new NotFoundLocalizedException( i18n, UsersInfoLocale.TERM_USER );

    if ( user.suspend && user.suspend.getTime() > Date.now() ) {
      throw new ForbiddenException( {
        statusCode: 403,
        internalCode: UserErrorsInternalCodeEnum.SUSPENDED_ACCOUNT,
        message: i18n.t( UsersErrorsLocal.USER_SUSPENDED ),
        error: UserErrorsEnum.SUSPENDED_ACCOUNT
      } );
    }

    if ( user.emailVerificationTokenExpiresAt.getTime() > Date.now() ) {
      const remainingTime = Math.trunc( ( user.emailVerificationTokenExpiresAt.getTime() - Date.now() ) / 1000 );
      throw new BadRequestException( i18n.t( UsersErrorsLocal.EMAIL_PHONE_VERIFICATION_CODE_LIMIT, { args: { time: remainingTime } } ) );
    }

    const expTimeInMins = +( await this.settingsService.findOne( SettingsKeyEnum.USERS_EMAIL_TOKEN_EXP_IN_MINS ) ).value ?? 20;

    user.emailVerificationToken = this.sixDigitTokenGenerator();
    user.emailVerificationTokenExpiresAt = new Date( Date.now() + ( expTimeInMins * 60_000 ) );

    const result = await this.userRepository.save( user );
    await this.cacheManager.reset();

    const defaultTemplatePath = path.join( __dirname, './templates/reset-password.template.hbs' );
    const customTemplateId = ( await this.settingsService.findOneOrNull( SettingsKeyEnum.USERS_EMAIL_RESET_PASSWORD_TEMPLATE_ID ) )?.value;
    const customTemplate = customTemplateId ? await this.postsService.findOne( customTemplateId ) : null;
    const websiteName = ( await this.settingsService.findOne( SettingsKeyEnum.SITE_NAME ) ).value;
    const websiteUrl = ( await this.settingsService.findOne( SettingsKeyEnum.SITE_URL ) ).value;
    const subject = ( await this.settingsService.findOne( SettingsKeyEnum.USERS_EMAIL_RESET_PASSWORD_SUBJECT ) ).value;
    const siteSupportEmail = ( await this.settingsService.findOne( SettingsKeyEnum.SITE_SUPPORT_EMAIL ) ).value;

    if ( customTemplate ) {
      const compiledTemplate = Handlebars.compile( customTemplate );
      const html = compiledTemplate( {
        websiteName,
        token: result.emailVerificationToken,
        websiteUrl
      } );
      return this.mailerService.sendMail( {
        from: siteSupportEmail,
        to: result.email,
        subject,
        html,
      } );
    }

    return this.mailerService.sendMail( {
      from: siteSupportEmail,
      to: result.email,
      subject,
      template: defaultTemplatePath,
      context: { websiteName, token: result.emailVerificationToken, websiteUrl }
    } );
  }

  // Reset password by email
  async resetPasswordByEmail ( resetPasswordDto: UserResetPasswordByEmailDto, i18n: I18nContext ): Promise<User> {
    const { email, password, token } = resetPasswordDto;
    const user = await this.userRepository.findOne( {
      where: { email }
    } );
    if ( !user ) throw new NotFoundLocalizedException( i18n, UsersInfoLocale.TERM_USER );

    if ( user.emailVerificationToken !== token || user.isEmailVerificationTokenExpired ) {
      throw new BadRequestException( i18n.t( UsersErrorsLocal.INVALID_EXPIRED_TOKEN ) );
    }

    // Hashing password
    const hash = await this.hash( password );
    user.password = hash;

    if ( !user.emailVerified ) user.emailVerified = true;
    user.emailVerificationTokenExpiresAt = new Date( Date.now() - 24 * 60 * 60 * 1000 );

    const result = await this.userRepository.save( user );
    await this.cacheManager.reset();

    return result;
  }

  // Reset password by mobile phone Request
  async resetPasswordByMobilePhoneReq ( userMobilePhoneDto: UserMobilePhoneDto, i18n: I18nContext ): Promise<User> {
    const { mobilePhone } = userMobilePhoneDto;
    const user = await this.userRepository.findOne( {
      where: { mobilePhone }
    } );
    if ( !user ) throw new NotFoundLocalizedException( i18n, UsersInfoLocale.TERM_USER );

    if ( user.suspend && user.suspend.getTime() > Date.now() ) {
      throw new ForbiddenException( {
        statusCode: 403,
        internalCode: UserErrorsInternalCodeEnum.SUSPENDED_ACCOUNT,
        message: i18n.t( UsersErrorsLocal.USER_SUSPENDED ),
        error: UserErrorsEnum.SUSPENDED_ACCOUNT
      } );
    }

    if ( user.mobilePhoneVerificationTokenExpiresAt.getTime() > Date.now() ) {
      const remainingTime = Math.trunc( ( user.mobilePhoneVerificationTokenExpiresAt.getTime() - Date.now() ) / 1000 );
      throw new BadRequestException( i18n.t( UsersErrorsLocal.MOBILE_PHONE_VERIFICATION_CODE_LIMIT, { args: { time: remainingTime } } ) );
    }

    const expTimeInMins = +( await this.settingsService.findOne( SettingsKeyEnum.USERS_MOBILE_TOKEN_EXP_IN_MINS ) ).value ?? 2;

    user.mobilePhoneVerificationToken = this.sixDigitTokenGenerator();
    user.mobilePhoneVerificationTokenExpiresAt = new Date( Date.now() + ( expTimeInMins * 60_000 ) );

    const result = await this.userRepository.save( user );
    await this.cacheManager.reset();

    const patternCode = ( await this.settingsService.findOne( SettingsKeyEnum.USERS_MOBILE_VERIFICATION_SMS_PATTERN_CODE ) ).value;
    const defaultOriginator = ( await this.settingsService.findOne( SettingsKeyEnum.SMS_DEFAULT_ORIGINATOR ) ).value;
    await this.smsService.sendByPattern(
      i18n,
      patternCode,
      defaultOriginator,
      user.mobilePhone,
      {
        name: user.firstName,
        verificationCode: result.mobilePhoneVerificationToken
      }
    );

    return result;
  }

  // Rest Password by Mobile Phone
  async resetPasswordByMobilePhone ( resetPasswordDto: UserResetPasswordByMobileDto, i18n: I18nContext ): Promise<User> {
    const { mobilePhone, password, token } = resetPasswordDto;
    const user = await this.userRepository.findOne( {
      where: { mobilePhone }
    } );
    if ( !user ) throw new NotFoundLocalizedException( i18n, UsersInfoLocale.TERM_USER );

    if ( user.mobilePhoneVerificationToken !== token || user.isMobilePhoneVerificationTokenExpired ) {
      throw new BadRequestException( i18n.t( UsersErrorsLocal.INVALID_EXPIRED_TOKEN ) );
    }

    // Hashing password
    const hash = await this.hash( password );
    user.password = hash;

    if ( !user.mobilePhoneVerified ) user.mobilePhoneVerified = true;
    user.mobilePhoneVerificationTokenExpiresAt = new Date( Date.now() - 24 * 60 * 60 * 1000 );

    const result = await this.userRepository.save( user );
    await this.cacheManager.reset();

    return result;
  }


  // Soft remove a user
  async softRemove ( i18n: I18nContext, id: string ): Promise<User> {
    const user = await this.userRepository.findOne( { where: { id } } );
    if ( !user ) throw new NotFoundLocalizedException( i18n, UsersInfoLocale.TERM_USER );

    const isUserOnlyAdmin = await this.isOnlyAdmin( id );
    if ( isUserOnlyAdmin ) throw new BadRequestException( i18n.t( UsersErrorsLocal.ONLY_ADMIN ) );

    await this.cacheManager.reset();
    return this.userRepository.softRemove( user );
  }

  // Recover a soft-removed user
  async recover ( i18n: I18nContext, id: string ): Promise<User> {
    const user = await this.userRepository.findOne( { where: { id }, withDeleted: true } );
    if ( !user ) throw new NotFoundLocalizedException( i18n, UsersInfoLocale.TERM_USER );

    await this.cacheManager.reset();
    return this.userRepository.recover( user );
  }

  // Remove a user permanently
  async remove ( i18n: I18nContext, id: string ): Promise<User> {
    const user = await this.userRepository.findOne( { where: { id }, withDeleted: true } );
    if ( !user ) throw new NotFoundLocalizedException( i18n, UsersInfoLocale.TERM_USER );

    const isUserOnlyAdmin = await this.isOnlyAdmin( id );
    if ( isUserOnlyAdmin ) throw new BadRequestException( i18n.t( UsersErrorsLocal.ONLY_ADMIN ) );

    await this.cacheManager.reset();
    return this.userRepository.remove( user );
  }

  // Find All Claims
  findAllClaims (): Promise<Claim[]> {
    return this.claimRepository.find();
  }

  /***********************/
  /* Helper Methods Area */
  /***********************/

  /**
 * Generate 6-digit token
 * @returns Six-digit token
 */
  sixDigitTokenGenerator () {
    return Math.floor( 100_000 + Math.random() * 900_000 );
  }

  // Hash data
  hash ( data: string ) {
    return bcrypt.hash( data, 10 );
  }

  // Access Token Generator
  generateAccessToken ( userId: string, email: string, claims: string[] ): Promise<string> {
    const secret = this.configService.get( EnvEnum.AUTH_ACCESS_TOKEN_SECRET );
    const expiresIn = this.configService.getOrThrow( EnvEnum.AUTH_ACCESS_TOKEN_EXPIRATION );

    return this.jwtService.signAsync(
      { sub: userId, email, clms: claims },
      { secret, expiresIn }
    );
  }

  // Refresh Token Generator
  generateRefreshToken ( userId: string, email: string ) {
    const secret = this.configService.get( EnvEnum.AUTH_REFRESH_TOKEN_SECRET );
    const expiresIn = this.configService.getOrThrow( EnvEnum.AUTH_REFRESH_TOKEN_EXPIRATION );

    return this.jwtService.signAsync(
      { sub: userId, email },
      { secret, expiresIn }
    );
  }

  // Generate avatar S3 key
  generateAvatarS3Key ( originalName: string, userId: string ): string {
    const rawFileName = path.parse( originalName ).name;
    const fileExt = path.parse( originalName ).ext;
    // Sanitizing 
    const sanitizedFileName = sanitize.addUnderscore( rawFileName );
    const key = `public/${ userId }/avatars/${ sanitizedFileName }_${ Date.now() }${ fileExt }`;
    return key;
  }

  // Sanitize biography
  async bioSanitizer ( bio: string ): Promise<string> {
    const sanitizeHtmlOptions = {
      allowedTags: [],
      allowedAttributes: {},
      allowedIframeHostnames: []
    };

    let sanitizedBio = sanitizeHtml( bio, sanitizeHtmlOptions );
    const forbiddenExps = ( await this.settingsService.findOne( SettingsKeyEnum.COMMENT_FORBIDDEN_EXPRESSIONS ) )
      .value
      .split( ',' ).map( e => e.trim() );

    forbiddenExps.map( exp => {
      const bioForbidden = sanitizedBio.includes( exp );
      if ( bioForbidden ) {
        sanitizedBio = bioForbidden ? sanitizedBio.replace( exp, '...' ) : sanitizedBio;
      }
    } );

    return sanitizedBio;
  }
}
