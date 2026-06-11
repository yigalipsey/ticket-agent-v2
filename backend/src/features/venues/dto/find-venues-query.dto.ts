import { IsOptional, IsUUID } from 'class-validator';

export class FindVenuesQueryDto {
  @IsOptional()
  popular?: string;

  @IsOptional()
  search?: string;

  @IsUUID('4')
  @IsOptional()
  cityId?: string;
}
