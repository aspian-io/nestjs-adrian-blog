import { IntersectionType, PickType } from "@nestjs/mapped-types";
import { CreateUserDto } from "./create-user.dto";
import { UsersVerificationTokenDto } from "./verification-token.dto";

export class UserActivateEmailRegistrationDto
  extends IntersectionType( PickType( CreateUserDto, [ 'email' ] as const ), UsersVerificationTokenDto ) { }