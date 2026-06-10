import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
} from 'class-validator';
import { EventStatus, MinPriceCurrency } from '../football-events.types';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class CreateFootballEventDto {
  @IsISO8601()
  @IsNotEmpty()
  startsAt!: string;

  @IsEnum(EventStatus)
  @IsOptional()
  status?: EventStatus;

  @IsUUID()
  @IsNotEmpty()
  competitionId!: string;

  @IsUUID()
  @IsOptional()
  homeTeamId?: string;

  @IsUUID()
  @IsOptional()
  awayTeamId?: string;

  @IsUUID()
  @IsNotEmpty()
  venueId!: string;

  @IsString()
  @IsOptional()
  homeTeamName?: string;

  @IsString()
  @IsOptional()
  awayTeamName?: string;

  @IsBoolean()
  @IsOptional()
  hasTbdTeam?: boolean;

  @IsString()
  @IsOptional()
  round?: string;

  @IsInt()
  @IsOptional()
  roundNumber?: number;

  @IsString()
  @IsOptional()
  @Matches(SLUG_PATTERN, {
    message: 'slug must be lowercase alphanumeric words separated by hyphens',
  })
  slug?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsBoolean()
  @IsOptional()
  isHot?: boolean;

  @IsInt()
  @IsOptional()
  apiFootballExternalId?: number;

  @IsInt()
  @IsOptional()
  footballDataExternalId?: number;

  @IsNumber()
  @IsOptional()
  minPriceAmount?: number;

  @IsEnum(MinPriceCurrency)
  @IsOptional()
  minPriceCurrency?: MinPriceCurrency;

  @IsNumber()
  @IsOptional()
  minPriceSortingIls?: number;

  @IsISO8601()
  @IsOptional()
  minPriceUpdatedAt?: string;
}
