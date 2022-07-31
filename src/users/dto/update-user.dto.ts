import { OmitType, PartialType } from "@nestjs/mapped-types";
import { AdminCreateUserDto } from "./create-user.dto";

export class UpdateUserDto extends PartialType( OmitType( AdminCreateUserDto, [ 'email', 'password' ] ) ) { }
