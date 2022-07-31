import { PartialType } from '@nestjs/mapped-types';
import { CreateSmDto } from './create-sm.dto';

export class UpdateSmDto extends PartialType(CreateSmDto) {}
