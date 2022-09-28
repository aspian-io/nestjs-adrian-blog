import { Controller, Get, Post, Body, Patch, Param, Delete, Res, UseGuards, HttpCode, HttpStatus, Query, UseInterceptors, UploadedFile, MaxFileSizeValidator, FileTypeValidator, ParseFilePipe, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { Serialize } from 'src/common/interceptors/serialize.interceptor';
import { IMetadataDecorator, Metadata } from 'src/common/decorators/metadata.decorator';
import { Response } from 'express';
import { Tokens } from './types/services.type';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { CurrentUser } from 'src/users/decorators/current-user.decorator';
import { IJwtStrategyUser, IRtStrategyUser } from './strategies/types';
import { RtAuthGuard } from './guards/rt.guard';
import { JwtAuthGuard } from './guards/jwt.guard';
import { PermissionsGuard } from './guards/require-permissions.guard';
import { RequirePermission } from './decorators/require-permission.decorator';
import { PermissionsEnum } from 'src/common/security/permissions.enum';
import { User } from './entities/user.entity';
import { IControllerUserLoginResult, IControllerUserRefreshTokensResult, IControllerUserRegisterResult } from './types/controllers.type';
import { I18n, I18nContext } from 'nestjs-i18n';
import { Claim } from './entities/claim.entity';
import { EnvEnum } from 'src/env.enum';
import { IListResultGenerator } from 'src/common/utils/filter-pagination.utils';
import { AdminUpdateUserDto, CreateUserDto, UpdateUserDto, UserLoginDto, UsersListQueryDto, UsersVerificationTokenDto } from './dto';
import { LoginRegisterDto, UserDto } from './dto';
import { UpdateUserClaimsDto } from './dto/update-claims.dto';
import { PostsService } from 'src/posts/posts.service';
import { PostListDto } from 'src/posts/dto/user/post-list.dto';
import { BookmarksListQueryDto } from 'src/posts/dto/user/bookmarks-list-query.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { UsersAvatarGuard } from './guards/users-avatar.guard';
import { UserEmailDto } from './dto/user-email.dto';
import { UserResetPasswordByEmailDto } from './dto/reset-password-by-email.dto';
import { UserMobilePhoneDto } from './dto/user-mobile-phone.dto';
import { UserResetPasswordByMobileDto } from './dto/reset-password-by-mobile.dto';
import { UserChangePasswordDto } from './dto/change-password.dto';
import { UserLoginByMobilePhoneDto } from './dto/login-by-mobile.dto';
import { UserActivateEmailRegistrationDto } from './dto/activate-email-registration.dto';
import { UserRegisterByMobileDto } from './dto/register-by-mobile.dto';
import { UserActivateMobileRegistrationDto } from './dto/activate-mobile-registration.dto';
import { LoginMethodsDto } from './dto/login-methods.dto';
import { AvatarEmptyValidator } from './validators/avatar-empty.validator';
import { OAuth2LoginRegisterDto } from './dto/oauth2-login-register.dto';

@Controller()
export class UsersController {
  constructor (
    private readonly usersService: UsersService,
    private readonly postsService: PostsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) { }

  /************************ */
  /* Users Controllers Area */
  /************************ */

  // Get Login Methods
  @Get( 'users/login-methods' )
  getLoginMethods (): Promise<LoginMethodsDto> {
    return this.usersService.getLoginMethods();
  }

  // Login by Email
  @Post( 'users/login-by-email' )
  @HttpCode( HttpStatus.OK )
  @Serialize( LoginRegisterDto )
  async loginByEmail (
    @I18n() i18n: I18nContext,
    @Body() userLoginDto: UserLoginDto,
    @Res( { passthrough: true } ) res: Response ): Promise<IControllerUserLoginResult> {
    const user = await this.usersService.loginByEmail( i18n, userLoginDto );
    const decodedRt = this.jwtService.decode( user.refreshToken );

    res.cookie(
      Tokens.REFRESH_TOKEN,
      user.refreshToken,
      {
        httpOnly: true,
        sameSite: true,
        secure: this.configService.getOrThrow( EnvEnum.NODE_ENV ) === 'production',
        expires: new Date( parseInt( decodedRt[ 'exp' ] ) * 1000 )
      } );

    return { ...user, accessToken: user.accessToken, refreshToken: user.refreshToken };
  }

  // OAuth2 Login
  @Post( 'users/oauth2-login' )
  @UseGuards( JwtAuthGuard )
  @HttpCode( HttpStatus.OK )
  @Serialize( LoginRegisterDto )
  async oAuth2Login (
    @I18n() i18n: I18nContext,
    @Body() body: OAuth2LoginRegisterDto,
    @Metadata() metadata: IMetadataDecorator,
    @Res( { passthrough: true } ) res: Response ) {
    const user = await this.usersService.oAuth2LoginRegister( i18n, body, metadata );
    const decodedRt = this.jwtService.decode( user.refreshToken );

    res.cookie(
      Tokens.REFRESH_TOKEN,
      user.refreshToken,
      {
        httpOnly: true,
        sameSite: true,
        secure: this.configService.getOrThrow( EnvEnum.NODE_ENV ) === 'production',
        expires: new Date( parseInt( decodedRt[ 'exp' ] ) * 1000 )
      } );

    return { ...user, accessToken: user.accessToken, refreshToken: user.refreshToken };
  }

  // Login by Mobile Phone Request
  @Post( 'users/login-by-mobile-phone/request' )
  @HttpCode( HttpStatus.OK )
  @Serialize( LoginRegisterDto )
  async loginByMobilePhoneRequest (
    @I18n() i18n: I18nContext,
    @Body() mobilePhoneDto: UserMobilePhoneDto ): Promise<User> {
    return this.usersService.loginByMobilePhoneReq( i18n, mobilePhoneDto );
  }

  // Login by Mobile Phone
  @Post( 'users/login-by-mobile-phone' )
  @HttpCode( HttpStatus.OK )
  @Serialize( LoginRegisterDto )
  async loginByMobilePhone (
    @Body() loginByMobilePhoneDto: UserLoginByMobilePhoneDto,
    @I18n() i18n: I18nContext,
    @Res( { passthrough: true } ) res: Response ): Promise<IControllerUserLoginResult> {
    const user = await this.usersService.loginByMobilePhone( loginByMobilePhoneDto, i18n );
    const decodedRt = this.jwtService.decode( user.refreshToken );

    res.cookie(
      Tokens.REFRESH_TOKEN,
      user.refreshToken,
      {
        httpOnly: true,
        sameSite: true,
        secure: this.configService.getOrThrow( EnvEnum.NODE_ENV ) === 'production',
        expires: new Date( parseInt( decodedRt[ 'exp' ] ) * 1000 )
      } );

    return { ...user, accessToken: user.accessToken, refreshToken: user.refreshToken };
  }

  // Register by email
  @Post( 'users/register-by-email' )
  @Serialize( LoginRegisterDto )
  async registerByEmail (
    @I18n() i18n: I18nContext,
    @Body() createUserDto: CreateUserDto,
    @Metadata() metadata: IMetadataDecorator ) {
    return this.usersService.registerByEmail( i18n, createUserDto, metadata );
  }

  // Activate email registration
  @Post( 'users/activate-email-registration' )
  @Serialize( LoginRegisterDto )
  async activateEmailRegistration (
    @I18n() i18n: I18nContext,
    @Body() dto: UserActivateEmailRegistrationDto,
    @Res( { passthrough: true } ) res: Response ): Promise<IControllerUserRegisterResult> {
    const user = await this.usersService.activateEmailRegistration( dto, i18n );
    const decodedRt = this.jwtService.decode( user.refreshToken );

    res.cookie(
      Tokens.REFRESH_TOKEN,
      user.refreshToken,
      {
        httpOnly: true,
        sameSite: true,
        secure: this.configService.getOrThrow( EnvEnum.NODE_ENV ) === 'production',
        expires: new Date( parseInt( decodedRt[ 'exp' ] ) * 1000 )
      } );

    return { ...user, accessToken: user.accessToken, refreshToken: user.refreshToken };
  }

  // Get verification email token remaining time in seconds
  @Post( 'users/email-token-remaining-time' )
  async getEmailTokenRemainingTimeInSec (
    @I18n() i18n: I18nContext,
    @Body() body: UserEmailDto ) {
    return this.usersService.getEmailTokenRemainingTimeInSec( i18n, body.email );
  }

  // Resend verification email
  @Post( 'users/resend-verification-email' )
  @Serialize( LoginRegisterDto )
  async resendVerificationTokenEmail (
    @I18n() i18n: I18nContext,
    @Body() body: UserEmailDto ) {
    return this.usersService.resendVerificationTokenEmail( i18n, body.email );
  }

  // Register by mobile
  @Post( 'users/register-by-mobile' )
  @Serialize( LoginRegisterDto )
  async registerByMobile (
    @I18n() i18n: I18nContext,
    @Body() dto: UserRegisterByMobileDto,
    @Metadata() metadata: IMetadataDecorator ): Promise<User> {
    return this.usersService.registerByMobilePhone( i18n, dto, metadata );
  }

  // Activate mobile registration
  @Post( 'users/activate-mobile-registration' )
  @Serialize( LoginRegisterDto )
  async activateMobileRegistration (
    @I18n() i18n: I18nContext,
    @Body() dto: UserActivateMobileRegistrationDto,
    @Res( { passthrough: true } ) res: Response ): Promise<IControllerUserRegisterResult> {
    const user = await this.usersService.activateMobilePhoneRegistration( dto, i18n );
    const decodedRt = this.jwtService.decode( user.refreshToken );

    res.cookie(
      Tokens.REFRESH_TOKEN,
      user.refreshToken,
      {
        httpOnly: true,
        sameSite: true,
        secure: this.configService.getOrThrow( EnvEnum.NODE_ENV ) === 'production',
        expires: new Date( parseInt( decodedRt[ 'exp' ] ) * 1000 )
      } );

    return { ...user, accessToken: user.accessToken, refreshToken: user.refreshToken };
  }

  // Refresh Tokens
  @UseGuards( RtAuthGuard )
  @Post( 'users/refresh-tokens' )
  @Serialize( LoginRegisterDto )
  async refreshTokens (
    @CurrentUser() user: IRtStrategyUser,
    @Res( { passthrough: true } ) res: Response ): Promise<IControllerUserRefreshTokensResult> {
    const result = await this.usersService.refreshTokens( user.refreshToken );
    const decodedRt = this.jwtService.decode( result.refreshToken );
    const cookie = res.cookie(
      Tokens.REFRESH_TOKEN,
      result.refreshToken,
      {
        httpOnly: true,
        sameSite: true,
        secure: this.configService.getOrThrow( EnvEnum.NODE_ENV ) === 'production',
        expires: new Date( parseInt( decodedRt[ 'exp' ] ) * 1000 )
      } );

    return { ...result, accessToken: result.accessToken, refreshToken: result.refreshToken };
  }

  // Logout
  @Get( 'users/logout' )
  @UseGuards( JwtAuthGuard )
  logout ( @Res( { passthrough: true } ) res: Response ): {} {
    res.removeHeader( 'authorization' );
    res.clearCookie( Tokens.REFRESH_TOKEN );
    return {};
  }

  // View Profile
  @Get( 'users/profile' )
  @UseGuards( JwtAuthGuard )
  @Serialize( UserDto )
  viewProfile ( @CurrentUser() user: IJwtStrategyUser, @I18n() i18n: I18nContext ): Promise<User> {
    return this.usersService.findOne( user.userId, i18n );
  }

  // Edit Profile
  @Patch( 'users/profile' )
  @UseGuards( JwtAuthGuard )
  @Serialize( UserDto )
  editProfile (
    @Body() body: UpdateUserDto,
    @I18n() i18n: I18nContext,
    @Metadata() metadata: IMetadataDecorator
  ): Promise<User> {
    return this.usersService.update( i18n, metadata.user.id, body, metadata, true );
  }

  // Update mobile phone number request
  @Post( 'users/edit-mobile-phone-request' )
  @UseGuards( JwtAuthGuard )
  @Serialize( UserDto )
  editMobilePhoneReq (
    @Body() dto: UserMobilePhoneDto,
    @I18n() i18n: I18nContext,
    @Metadata() metadata: IMetadataDecorator
  ) {
    return this.usersService.updateMobilePhoneReq( dto.mobilePhone, i18n, metadata );
  }

  // Update mobile phone number request
  @Patch( 'users/edit-mobile-phone' )
  @UseGuards( JwtAuthGuard )
  @Serialize( UserDto )
  editMobilePhone (
    @Body() dto: UsersVerificationTokenDto,
    @I18n() i18n: I18nContext,
    @Metadata() metadata: IMetadataDecorator
  ) {
    return this.usersService.updateMobilePhone( metadata.user.id, dto.token, i18n );
  }

  // Edit Profile Avatar
  @Patch( 'users/profile/edit-avatar' )
  @UseGuards( JwtAuthGuard, UsersAvatarGuard )
  @UseInterceptors( FileInterceptor( 'avatar' ) )
  @Serialize( UserDto )
  updateAvatar (
    @UploadedFile( new ParseFilePipe( {
      validators: [
        new MaxFileSizeValidator( { maxSize: 1024 * 100 } ),
        new FileTypeValidator( { fileType: 'jpeg' } )
      ]
    } ) ) avatar: Express.Multer.File,
    @I18n() i18n: I18nContext,
    @Metadata() metadata: IMetadataDecorator
  ): Promise<User> {
    return this.usersService.updateAvatar( avatar, i18n, metadata );
  }

  // Delete Profile Avatar
  @Delete( 'users/profile/delete-avatar' )
  @UseGuards( JwtAuthGuard, UsersAvatarGuard )
  @Serialize( UserDto )
  removeAvatar (
    @I18n() i18n: I18nContext,
    @Metadata() metadata: IMetadataDecorator
  ): Promise<User> {
    return this.usersService.removeAvatar( i18n, metadata );
  }

  // Find all bookmarks
  @Get( 'users/profile/bookmarks' )
  @UseGuards( JwtAuthGuard )
  @Serialize( PostListDto )
  findAllBookmarks ( @Query() query: BookmarksListQueryDto, @CurrentUser() currentUser: IJwtStrategyUser ) {
    return this.postsService.findAllBookmarks( query, currentUser.userId );
  }

  // Email Verification Request
  @Get( 'users/email/verification-request' )
  @UseGuards( JwtAuthGuard )
  @Serialize( UserDto )
  emailVerificationReq ( @I18n() i18n: I18nContext, @Metadata() metadata: IMetadataDecorator ) {
    return this.usersService.verifyEmailReq( i18n, metadata.user.id );
  }

  // Verify Email
  @Post( 'users/email/verify' )
  @UseGuards( JwtAuthGuard )
  @Serialize( UserDto )
  verifyEmail (
    @Body() body: UsersVerificationTokenDto,
    @Metadata() metadata: IMetadataDecorator,
    @I18n() i18n: I18nContext ): Promise<User> {
    return this.usersService.verifyEmail( i18n, metadata.user.id, body.token );
  }

  // Mobile Phone Verification Request
  @Get( 'users/mobile-phone/verification-request' )
  @UseGuards( JwtAuthGuard )
  @Serialize( UserDto )
  mobilePhoneVerificationReq ( @I18n() i18n: I18nContext, @Metadata() metadata: IMetadataDecorator ) {
    return this.usersService.verifyMobilePhoneReq( i18n, metadata.user.id );
  }

  // Verify Mobile Phone
  @Post( 'users/mobile-phone/verify' )
  @UseGuards( JwtAuthGuard )
  @Serialize( UserDto )
  verifyMobilePhone (
    @Body() body: UsersVerificationTokenDto,
    @Metadata() metadata: IMetadataDecorator,
    @I18n() i18n: I18nContext ): Promise<User> {
    return this.usersService.verifyMobilePhone( i18n, metadata.user.id, body.token );
  }

  // Change Password
  @Patch( 'users/change-password/:id' )
  @UseGuards( JwtAuthGuard )
  @Serialize( UserDto )
  changePassword (
    @Param( 'id' ) id: string,
    @Body() body: UserChangePasswordDto,
    @I18n() i18n: I18nContext ): Promise<User> {
    return this.usersService.changePassword( id, body, i18n );
  }

  // Reset Password by Email Request
  @Post( 'users/reset-password/by-email/request' )
  @Serialize( UserDto )
  resetPasswordByEmailReq ( @Body() body: UserEmailDto, @I18n() i18n: I18nContext ) {
    return this.usersService.resetPasswordByEmailReq( body, i18n );
  }

  // Reset Password by Email
  @Post( 'users/reset-password/by-email' )
  @Serialize( UserDto )
  resetPasswordByEmail ( @Body() body: UserResetPasswordByEmailDto, @I18n() i18n: I18nContext ) {
    return this.usersService.resetPasswordByEmail( body, i18n );
  }

  // Reset Password by Mobile Phone Request
  @Post( 'users/reset-password/by-mobile-phone/request' )
  @Serialize( UserDto )
  resetPasswordByMobilePhoneReq ( @Body() body: UserMobilePhoneDto, @I18n() i18n: I18nContext ) {
    return this.usersService.resetPasswordByMobilePhoneReq( body, i18n );
  }

  // Reset Password by Mobile Phone
  @Post( 'users/reset-password/by-mobile-phone' )
  @Serialize( UserDto )
  resetPasswordByMobilePhone ( @Body() body: UserResetPasswordByMobileDto, @I18n() i18n: I18nContext ) {
    return this.usersService.resetPasswordByMobilePhone( body, i18n );
  }

  /************************ */
  /* Admin Controllers Area */
  /************************ */

  // Users List
  @Get( 'admin/users' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.USER_READ )
  adminFindAll ( @Query() query: UsersListQueryDto, @I18n() i18n: I18nContext ): Promise<IListResultGenerator<User>> {
    return this.usersService.findAll( query );
  }

  // User Details
  @Get( 'admin/users/:id' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.USER_READ )
  adminFindOne ( @Param( 'id' ) id: string, @I18n() i18n: I18nContext ): Promise<User> {
    return this.usersService.findOne( id, i18n );
  }

  // Edit User
  @Patch( 'admin/users/:id' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.USER_EDIT )
  adminUpdate (
    @I18n() i18n: I18nContext,
    @Param( 'id' ) id: string,
    @Body() body: AdminUpdateUserDto,
    @Metadata() metadata: IMetadataDecorator
  ): Promise<User> {
    return this.usersService.update( i18n, id, body, metadata );
  }

  // Edit Profile Avatar
  @Patch( 'admin/users/edit-avatar/:id' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.USER_EDIT )
  @UseInterceptors( FileInterceptor( 'avatar' ) )
  adminUpdateAvatar (
    @UploadedFile( new ParseFilePipe( {
      validators: [
        new AvatarEmptyValidator(),
        new MaxFileSizeValidator( { maxSize: 1024 * 100 } ),
        new FileTypeValidator( { fileType: 'jpeg' } )
      ]
    } ) ) avatar: Express.Multer.File,
    @Param( 'id' ) id: string,
    @I18n() i18n: I18nContext,
    @Metadata() metadata: IMetadataDecorator
  ): Promise<User> {
    return this.usersService.updateAvatar( avatar, i18n, metadata, id );
  }

  // Delete Profile Avatar
  @Delete( 'admin/users/delete-avatar/:id' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.USER_DELETE )
  adminRemoveAvatar (
    @Param( 'id' ) id: string,
    @I18n() i18n: I18nContext,
    @Metadata() metadata: IMetadataDecorator
  ): Promise<User> {
    return this.usersService.removeAvatar( i18n, metadata, id );
  }

  // Edit User Claims
  @Patch( 'admin/users/update-claims/:id' )
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.USER_EDIT )
  adminUpdateUserClaims (
    @I18n() i18n: I18nContext,
    @Param( 'id' ) id: string,
    @Body() body: UpdateUserClaimsDto,
  ): Promise<User> {
    return this.usersService.updateUserClaims( id, body, i18n );
  }

  // Soft Remove User
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.USER_DELETE )
  @Delete( 'admin/users/soft-delete/:id' )
  adminSoftRemove ( @I18n() i18n: I18nContext, @Param( 'id' ) id: string ): Promise<User> {
    return this.usersService.softRemove( i18n, id );
  }

  // Recover User
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.USER_DELETE )
  @HttpCode( HttpStatus.OK )
  @Patch( 'admin/users/recover/:id' )
  adminRecover ( @I18n() i18n: I18nContext, @Param( 'id' ) id: string ): Promise<User> {
    return this.usersService.recover( i18n, id );
  }

  // Delete User
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.USER_DELETE )
  @Delete( 'admin/users/permanent-delete/:id' )
  adminRemove ( @I18n() i18n: I18nContext, @Param( 'id' ) id: string ): Promise<User> {
    return this.usersService.remove( i18n, id );
  }

  // Claims List
  @UseGuards( JwtAuthGuard, PermissionsGuard )
  @RequirePermission( PermissionsEnum.ADMIN, PermissionsEnum.USER_READ )
  @Get( 'admin/claims' )
  adminFindAllClaims (): Promise<Claim[]> {
    return this.usersService.findAllClaims();
  }
}
