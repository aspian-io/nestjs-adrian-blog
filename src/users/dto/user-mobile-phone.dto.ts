import { PickType } from "@nestjs/mapped-types";
import { CreateUserDto } from "./create-user.dto";

export class UserMobilePhoneDto extends PickType( CreateUserDto, [ 'mobilePhone' ] ) { }