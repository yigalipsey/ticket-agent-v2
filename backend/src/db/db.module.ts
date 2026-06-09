import { Module } from "@nestjs/common";
import { drizzleProvider } from "./drizzle.provider";

@Module({
  imports: [],
  providers: [drizzleProvider],
  exports: [drizzleProvider],
})
export class DbModule {}
