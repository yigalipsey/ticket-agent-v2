import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  FootballEventsRepository,
  FindAllOptions,
} from "./football-events.repository";
import { TeamsService } from "../teams/teams.service";
import type { CreateFootballEventDto } from "./dto/create-football-event.dto";
import type { UpdateFootballEventDto } from "./dto/update-football-event.dto";
import type { NewFootballEvent, FootballEvent } from "./football-events.types";
import { translateDomainError } from "../../db/error-handler";

/** Hard cap on slug collision suffix attempts to prevent infinite loops. */
const MAX_SLUG_ATTEMPTS = 100;

@Injectable()
export class FootballEventsService {
  constructor(
    private readonly repository: FootballEventsRepository,
    private readonly teamsService: TeamsService,
  ) {}

  findAll(options?: FindAllOptions): Promise<FootballEvent[]> {
    return this.repository.findAll(options);
  }

  async findByEventNumber(eventNumber: number): Promise<FootballEvent> {
    const event = await this.repository.findByEventNumber(eventNumber);
    if (!event) {
      throw new NotFoundException(
        `Football event with number ${eventNumber} not found`,
      );
    }
    return event;
  }

  async create(dto: CreateFootballEventDto): Promise<FootballEvent> {
    // 1. Cheap sync validations BEFORE any I/O
    this.validateTeamXor(
      dto.homeTeamId,
      dto.homeTeamName,
      "homeTeamId",
      "homeTeamName",
    );
    this.validateTeamXor(
      dto.awayTeamId,
      dto.awayTeamName,
      "awayTeamId",
      "awayTeamName",
    );

    // 2. Resolve slug (only I/O needed before insert — team slug lookups + collision check)
    const slug = await this.resolveSlugForCreate(dto);

    // 3. Build entity and persist — FK/unique violations are caught by handleDbError in repo
    const newEvent: NewFootballEvent = {
      starts_at: new Date(dto.startsAt),
      status: dto.status ?? "scheduled",
      competition_id: dto.competitionId,
      home_team_id: dto.homeTeamId,
      away_team_id: dto.awayTeamId,
      venue_id: dto.venueId,
      home_team_name: dto.homeTeamName,
      away_team_name: dto.awayTeamName,
      has_tbd_team: dto.hasTbdTeam ?? false,
      round: dto.round,
      round_number: dto.roundNumber,
      slug,
      tags: dto.tags,
      is_hot: dto.isHot ?? false,
      api_football_external_id: dto.apiFootballExternalId,
      football_data_external_id: dto.footballDataExternalId,
      min_price_amount: dto.minPriceAmount?.toString(),
      min_price_currency: dto.minPriceCurrency,
      min_price_sorting_ils: dto.minPriceSortingIls?.toString(),
      min_price_updated_at: dto.minPriceUpdatedAt
        ? new Date(dto.minPriceUpdatedAt)
        : null,
    };

    try {
      return await this.repository.create(newEvent);
    } catch (err) {
      translateDomainError(err);
      throw err;
    }
  }

  async update(
    id: string,
    dto: UpdateFootballEventDto,
  ): Promise<FootballEvent> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Football event with ID "${id}" not found`);
    }

    // 1. Compute merged state for cross-field validation (no I/O)
    const merged = this.mergeEventState(existing, dto);

    // 2. Required-field checks on merged state — sync, no I/O
    if (!merged.venue_id)
      throw new BadRequestException("venueId cannot be null or empty");
    if (!merged.competition_id)
      throw new BadRequestException("competitionId cannot be null or empty");
    if (!merged.starts_at)
      throw new BadRequestException("startsAt cannot be null or empty");

    // 3. XOR validations on merged state — sync, no I/O
    this.validateTeamXor(
      merged.home_team_id ?? undefined,
      merged.home_team_name ?? undefined,
      "homeTeamId",
      "homeTeamName",
    );
    this.validateTeamXor(
      merged.away_team_id ?? undefined,
      merged.away_team_name ?? undefined,
      "awayTeamId",
      "awayTeamName",
    );

    // 4. Slug resolution (only if slug is actually changing)
    const finalSlug = await this.resolveSlugForUpdate(dto, existing, id);

    // 5. Build the minimal patch and persist
    const patch = this.buildUpdatePatch(dto, finalSlug, existing.slug);

    try {
      const updated = await this.repository.update(id, patch);
      if (!updated) {
        throw new NotFoundException(`Football event with ID "${id}" not found`);
      }
      return updated;
    } catch (err) {
      translateDomainError(err);
      throw err;
    }
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Validates that exactly one of (teamId, teamName) is set.
   * Must be called before any I/O to fail fast on bad input.
   */
  private validateTeamXor(
    teamId: string | undefined,
    teamName: string | undefined,
    idField: string,
    nameField: string,
  ): void {
    const hasId = !!teamId;
    const hasName = !!teamName;
    if ((hasId && hasName) || (!hasId && !hasName)) {
      throw new BadRequestException(
        `Exactly one of ${idField} or ${nameField} must be set.`,
      );
    }
  }

  /** Generates or validates a slug for a new event, then resolves any collisions. */
  private async resolveSlugForCreate(
    dto: CreateFootballEventDto,
  ): Promise<string> {
    let baseSlug = dto.slug;

    if (!baseSlug) {
      let homePart = dto.homeTeamName ? this.slugify(dto.homeTeamName) : "";
      let awayPart = dto.awayTeamName ? this.slugify(dto.awayTeamName) : "";

      if (dto.homeTeamId && !homePart) {
        const teamSlug = await this.teamsService.findSlugById(dto.homeTeamId);
        if (teamSlug) homePart = teamSlug;
      }

      if (dto.awayTeamId && !awayPart) {
        const teamSlug = await this.teamsService.findSlugById(dto.awayTeamId);
        if (teamSlug) awayPart = teamSlug;
      }

      const datePart = dto.startsAt.split("T")[0];
      baseSlug = `${homePart}-vs-${awayPart}-${datePart}`
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-");
    }

    return this.resolveSlugCollision(baseSlug);
  }

  /** Returns the existing slug unchanged if not being updated; otherwise resolves collisions. */
  private async resolveSlugForUpdate(
    dto: UpdateFootballEventDto,
    existing: FootballEvent,
    id: string,
  ): Promise<string> {
    if (dto.slug === undefined || dto.slug === existing.slug) {
      return existing.slug;
    }
    return this.resolveSlugCollision(dto.slug, id);
  }

  /**
   * Appends an incrementing suffix until a free slug is found.
   * Throws ConflictException after MAX_SLUG_ATTEMPTS to prevent infinite loops.
   */
  private async resolveSlugCollision(
    baseSlug: string,
    excludeId?: string,
  ): Promise<string> {
    let finalSlug = baseSlug;
    let suffix = 1;

    while (await this.repository.checkSlugExists(finalSlug, excludeId)) {
      if (suffix > MAX_SLUG_ATTEMPTS) {
        throw new ConflictException(
          `Could not generate a unique slug for "${baseSlug}" after ${MAX_SLUG_ATTEMPTS} attempts`,
        );
      }
      finalSlug = `${baseSlug}-${suffix++}`;
    }

    return finalSlug;
  }

  /**
   * Merges existing DB state with the incoming DTO to produce the effective
   * final state for cross-field validation without touching the database.
   */
  private mergeEventState(
    existing: FootballEvent,
    dto: UpdateFootballEventDto,
  ) {
    return {
      starts_at:
        dto.startsAt !== undefined
          ? dto.startsAt
            ? new Date(dto.startsAt)
            : null
          : existing.starts_at,
      competition_id:
        dto.competitionId !== undefined
          ? dto.competitionId
          : existing.competition_id,
      venue_id: dto.venueId !== undefined ? dto.venueId : existing.venue_id,
      home_team_id:
        dto.homeTeamId !== undefined ? dto.homeTeamId : existing.home_team_id,
      away_team_id:
        dto.awayTeamId !== undefined ? dto.awayTeamId : existing.away_team_id,
      home_team_name:
        dto.homeTeamName !== undefined
          ? dto.homeTeamName
          : existing.home_team_name,
      away_team_name:
        dto.awayTeamName !== undefined
          ? dto.awayTeamName
          : existing.away_team_name,
    };
  }

  /**
   * Builds a minimal patch object containing only fields present in the DTO.
   * Always sets `updated_at` so the timestamp stays accurate.
   */
  private buildUpdatePatch(
    dto: UpdateFootballEventDto,
    finalSlug: string,
    existingSlug: string,
  ): Partial<NewFootballEvent> {
    const patch: Partial<NewFootballEvent> = {
      updated_at: new Date(),
    };

    if (dto.startsAt !== undefined) patch.starts_at = new Date(dto.startsAt);
    if (dto.status !== undefined) patch.status = dto.status;
    if (dto.competitionId !== undefined)
      patch.competition_id = dto.competitionId;
    if (dto.homeTeamId !== undefined) patch.home_team_id = dto.homeTeamId;
    if (dto.awayTeamId !== undefined) patch.away_team_id = dto.awayTeamId;
    if (dto.venueId !== undefined) patch.venue_id = dto.venueId;
    if (dto.homeTeamName !== undefined) patch.home_team_name = dto.homeTeamName;
    if (dto.awayTeamName !== undefined) patch.away_team_name = dto.awayTeamName;
    if (dto.hasTbdTeam !== undefined) patch.has_tbd_team = dto.hasTbdTeam;
    if (dto.round !== undefined) patch.round = dto.round;
    if (dto.roundNumber !== undefined) patch.round_number = dto.roundNumber;
    if (finalSlug !== existingSlug) patch.slug = finalSlug;
    if (dto.tags !== undefined) patch.tags = dto.tags;
    if (dto.isHot !== undefined) patch.is_hot = dto.isHot;
    if (dto.apiFootballExternalId !== undefined)
      patch.api_football_external_id = dto.apiFootballExternalId;
    if (dto.footballDataExternalId !== undefined)
      patch.football_data_external_id = dto.footballDataExternalId;
    if (dto.minPriceAmount !== undefined)
      patch.min_price_amount = dto.minPriceAmount?.toString() ?? null;
    if (dto.minPriceCurrency !== undefined)
      patch.min_price_currency = dto.minPriceCurrency;
    if (dto.minPriceSortingIls !== undefined)
      patch.min_price_sorting_ils = dto.minPriceSortingIls?.toString() ?? null;
    if (dto.minPriceUpdatedAt !== undefined)
      patch.min_price_updated_at = dto.minPriceUpdatedAt
        ? new Date(dto.minPriceUpdatedAt)
        : null;

    return patch;
  }

  private slugify(text: string): string {
    return text
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // remove accents
      .replace(/[^a-z0-9 -]/g, "") // remove invalid chars
      .replace(/\s+/g, "-") // collapse whitespace → hyphens
      .replace(/-+/g, "-"); // collapse consecutive hyphens
  }
}
