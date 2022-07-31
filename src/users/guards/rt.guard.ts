import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class RtAuthGuard extends AuthGuard( 'jwt-refresh' ) { }
