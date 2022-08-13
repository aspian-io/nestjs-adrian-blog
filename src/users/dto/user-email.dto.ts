import { PickType } from "@nestjs/mapped-types";
import { CreateUserDto } from "./create-user.dto";

export class UserEmailDto extends PickType( CreateUserDto, [ 'email' ] ) { }