import { Expose, Type } from "class-transformer";

class MemoryStats {
  @Expose()
  totalMemMb: number;

  @Expose()
  usedMemMb: number;
}

export class DashboardSystemStatsDto {
  @Expose()
  cpuUsagePercentage: number;

  @Expose()
  @Type( () => MemoryStats )
  memoryUsage: MemoryStats;
}

export class DashboardPostsStatsDto {
  @Expose()
  blogsNumber: number;

  @Expose()
  newsNumber: number;

  @Expose()
  projectsNumber: number;
}