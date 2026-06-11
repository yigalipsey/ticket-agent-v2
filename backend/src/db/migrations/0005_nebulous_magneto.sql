ALTER TABLE "football_events" DROP CONSTRAINT "football_events_competition_id_competitions_id_fk";
--> statement-breakpoint
ALTER TABLE "football_events" DROP CONSTRAINT "football_events_home_team_id_teams_id_fk";
--> statement-breakpoint
ALTER TABLE "football_events" DROP CONSTRAINT "football_events_away_team_id_teams_id_fk";
--> statement-breakpoint
ALTER TABLE "football_events" DROP CONSTRAINT "football_events_venue_id_venues_id_fk";
--> statement-breakpoint
ALTER TABLE "football_events" ADD CONSTRAINT "football_events_competition_id_competitions_id_fk" FOREIGN KEY ("competition_id") REFERENCES "public"."competitions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "football_events" ADD CONSTRAINT "football_events_home_team_id_teams_id_fk" FOREIGN KEY ("home_team_id") REFERENCES "public"."teams"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "football_events" ADD CONSTRAINT "football_events_away_team_id_teams_id_fk" FOREIGN KEY ("away_team_id") REFERENCES "public"."teams"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "football_events" ADD CONSTRAINT "football_events_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE restrict ON UPDATE no action;