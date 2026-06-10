import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { EventStatus } from '../football-events.types';

export class FindFootballEventsQueryDto {
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() || undefined : value
  )
  @IsUUID('4', { message: 'competitionId must be a valid UUID v4' })
  competitionId?: string;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() || undefined : value
  )
  @IsUUID('4', { message: 'venueId must be a valid UUID v4' })
  venueId?: string;

  @IsOptional()
  @IsEnum(EventStatus, {
    message: `status must be one of: ${Object.values(EventStatus).join(', ')}`,
  })
  status?: EventStatus;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (['true', '1', 'yes'].includes(normalized)) return true;
      if (['false', '0', 'no'].includes(normalized)) return false;
    }
    return value;
  })
  @IsBoolean({ message: 'isHot must be a boolean value' })
  isHot?: boolean;

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    const sanitized = value.trim().toLowerCase().replace(/\s+/g, '-');
    return sanitized || undefined;
  })
  @IsString()
  @MaxLength(200, { message: 'slug must be shorter than 200 characters' })
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must contain only lowercase letters, numbers, and hyphens',
  })
  slug?: string;

  /** Number of results to return. Defaults to 20, max 100. */
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? parseInt(value, 10) : value))
  @IsInt({ message: 'limit must be an integer' })
  @Min(1, { message: 'limit must be at least 1' })
  @Max(100, { message: 'limit cannot exceed 100' })
  limit?: number;

  /** Zero-based offset for pagination. Defaults to 0. */
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? parseInt(value, 10) : value))
  @IsInt({ message: 'offset must be an integer' })
  @Min(0, { message: 'offset must be 0 or greater' })
  offset?: number;
}