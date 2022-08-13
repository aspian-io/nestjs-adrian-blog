import { IntersectionType, PickType } from "@nestjs/mapped-types";
import { CreateUserDto } from "./create-user.dto";
import { UsersVerificationTokenDto } from "./verification-token.dto";

export class UserActivateMobileRegistrationDto
  extends IntersectionType( PickType( CreateUserDto, [ 'mobilePhone' ] as const ), UsersVerificationTokenDto ) { }