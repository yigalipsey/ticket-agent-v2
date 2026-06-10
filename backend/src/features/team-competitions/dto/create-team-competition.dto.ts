import { IsNotEmpty, IsOptional, IsUUID, Matches, IsIn } from 'class-validator';

export class CreateTeamCompetitionDto {
  @IsUUID('4')
  @IsNotEmpty()
  teamId!: string;

  @IsUUID('4')
  @IsNotEmpty()
  competitionId!: string;

  @IsNotEmpty()
  @Matches(/^\d{4}\/\d{4}$/, {
    message: 'Season must be in format YYYY/YYYY',
  })
  season!: string;

  @IsOptional()
  @IsIn(['active', 'eliminated', 'relegated', 'withdrawn'])
  status?: 'active' | 'eliminated' | 'relegated' | 'withdrawn';
}
