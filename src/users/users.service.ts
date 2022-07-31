import { BadRequestException, CACHE_MANAGER, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IMetadataDecorator } from 'src/common/decorators/metadata.decorator';
import { Between, In, Not, Raw, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { IServiceUserLoginResult, IServiceUserRefreshTokensResult, IServiceUserRegisterResult } from './types/services.type';
import { I18nContext } from 'nestjs-i18n';
import { UsersInfoLocale } from 'src/i18n/locale-keys/users/info.locale';
import { NotFoundLocalizedException } from 'src/common/exceptions/not-found-localized.exception';
import { UsersErrorsLocal } from 'src/i18n/locale-keys/users/errors.locale';
import { PermissionsEnum } from 'src/common/security/permissions.enum';
import { Claim } from './entities/claim.entity';
import { Cache } from 'cache-manager';
import { EnvEnum } from 'src/env.enum';
import { FilterPaginationUtil, IListResultGenerator } from 'src/common/utils/filter-pagination.utils';
import { AdminUpdateUserDto, AdminCreateUserDto, UserLoginDto, UsersListQueryDto } from './dto';
import { UpdateUserClaimsDto } from './dto/update-claims.dto';

@Injectable()
export class UsersService {
  constructor (
    @InjectRepository( User ) private readonly userRepository: Repository<User>,
    @InjectRepository( Claim ) private readonly claimRepository: Repository<Claim>,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    @Inject( CACHE_MANAGER ) private cacheManager: Cache
  ) { }

  // Login Service (Local JWT)
  async loginLocal ( i18n: I18nContext, userLoginDto: UserLoginDto ): Promise<IServiceUserLoginResult> {
    const user = await this.userRepository.findOne( {
      where: { email: userLoginDto.username },
      relations: {
        claims: true,
      }
    } );
    if ( !user ) throw new NotFoundException( i18n.t( UsersErrorsLocal.INCORRECT_CREDENTIALS ) );

    const passwordMatch = await bcrypt.compare( userLoginDto.password, user.password );
    if ( !passwordMatch ) throw new BadRequestException( i18n.t( UsersErrorsLocal.INCORRECT_CREDENTIALS ) );

    if ( user.suspend && user.suspend.getTime() > Date.now() ) {
      throw new ForbiddenException( i18n.t( UsersErrorsLocal.USER_SUSPENDED ) );
    }

    const accessToken = await this.generateAccessToken( user.id, user.email, user.claims.map( c => c.name ) );
    const refreshToken = await this.generateRefreshToken( user.id, user.email );

    return {
      ...user,
      accessToken,
      refreshToken
    };
  }

  // Register Service (Local JWT)
  async registerLocal ( i18n: I18nContext, createUserDto: AdminCreateUserDto, metadata: IMetadataDecorator ): Promise<IServiceUserRegisterResult> {
    const user = await this.create( i18n, createUserDto, metadata );
    const accessToken = await this.generateAccessToken( user.id, user.email, [] );
    const refreshToken = await this.generateRefreshToken( user.id, user.email );

    return {
      ...user,
      accessToken,
      refreshToken
    };
  }

  // Create a new user
  async create ( i18n: I18nContext, createUserDto: AdminCreateUserDto, metadata: IMetadataDecorator ): Promise<User> {
    const { ipAddress, userAgent } = metadata;
    const existingUser = await this.userRepository.findOne( { where: { email: createUserDto.email } } );
    if ( existingUser ) {
      throw new BadRequestException( i18n.t( UsersErrorsLocal.EMAIL_IN_USE ) );
    }
    // Check if new mobile phone is in use
    if ( createUserDto.mobilePhone ) {
      const duplicateMobilePhone = await this.userRepository.findOne( { where: { mobilePhone: createUserDto.mobilePhone } } );
      if ( duplicateMobilePhone ) throw new BadRequestException( i18n.t( UsersErrorsLocal.MOBILE_PHONE_IN_USE ) );
    }
    // Hashing password
    const hash = await this.hash( createUserDto.password );

    const user = this.userRepository.create( {
      ...createUserDto,
      password: hash, // replace hashed password
      ipAddress,
      userAgent
    } );

    await this.cacheManager.reset();
    return await this.userRepository.save( user );
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

  // Check to see if user is the only admin
  async isOnlyAdmin ( id: string ) {
    const adminClaim = await this.claimRepository.findOne( { where: { name: PermissionsEnum.ADMIN } } );
    const isUserAdmin = await this.userRepository.findOne( { relations: { claims: true }, where: { id, claims: { id: adminClaim.id } } } );
    const adminCount = await this.userRepository.count( { relations: { claims: true }, where: { claims: { id: adminClaim.id } } } );
    return !!isUserAdmin && adminCount <= 1;
  }

  // Update user's info
  async update ( i18n: I18nContext, id: string, userBody: AdminUpdateUserDto, logData: IMetadataDecorator ): Promise<User> {

    const user = await this.findOne( id, i18n );
    // Check if new email address is in use
    if ( userBody.email && userBody.email !== user.email ) {
      const duplicateEmail = await this.userRepository.findOne( { where: { id: Not( id ), email: userBody.email } } );
      if ( duplicateEmail ) throw new BadRequestException( i18n.t( UsersErrorsLocal.EMAIL_IN_USE ) );
    }
    // Check if new mobile phone is in use
    if ( userBody.mobilePhone && userBody.mobilePhone !== user.mobilePhone ) {
      const duplicateMobilePhone = await this.userRepository.findOne( { where: { id: Not( id ), mobilePhone: userBody.mobilePhone } } );
      if ( duplicateMobilePhone ) throw new BadRequestException( i18n.t( UsersErrorsLocal.MOBILE_PHONE_IN_USE ) );
    }

    // Hash new password
    userBody.password = userBody?.password ? await this.hash( userBody.password ) : undefined;

    Object.assign( user, userBody );
    user.ipAddress = logData.ipAddress;
    user.userAgent = logData.userAgent;

    await this.cacheManager.reset();
    return this.userRepository.save( user );
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
}
