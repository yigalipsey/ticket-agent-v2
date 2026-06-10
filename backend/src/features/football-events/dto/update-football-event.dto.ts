import { PartialType } from '@nestjs/mapped-types';
import { CreateFootballEventDto } from './create-football-event.dto';

export class UpdateFootballEventDto extends PartialType(CreateFootballEventDto) {}
