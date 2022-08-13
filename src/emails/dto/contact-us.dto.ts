import { PickType } from "@nestjs/mapped-types";
import { IsEmail, IsMobilePhone, IsNotEmpty, IsString } from "class-validator";
import { SendEmailDto } from "./send-email.dto";

export class EmailContactUsDto extends PickType( SendEmailDto, [ 'from', 'subject', 'priority', 'html' ] as const ) { }