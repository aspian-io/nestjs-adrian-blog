import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy, RefreshTokenStrategy } from './strategies';
import { JwtAuthGuard } from './guards/jwt.guard';
import { RtAuthGuard } from './guards/rt.guard';
import { PermissionsGuard } from './guards/require-permissions.guard';
import { Claim } from './entities/claim.entity';
import { GoogleStrategy } from './strategies/google.strategy';
import { UppyJwtStrategy } from './strategies/uppy.strategy';
import { PostsModule } from 'src/posts/posts.module';
import { AvatarEmptyValidator } from './validators/avatar-empty.validator';

@Module( {
  imports: [
    TypeOrmModule.forFeature( [ User, Claim ] ),
    PassportModule,
    JwtModule.register( {} ),
    PostsModule,
  ],
  controllers: [ UsersController ],
  providers: [
    UsersService,
    JwtStrategy,
    GoogleStrategy,
    UppyJwtStrategy,
    RefreshTokenStrategy,
    JwtAuthGuard,
    RtAuthGuard,
    PermissionsGuard,
    AvatarEmptyValidator
  ],
  exports: [ TypeOrmModule, UsersService ]
} )
export class UsersModule { }
