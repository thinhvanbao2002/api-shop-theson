import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from "@nestjs/common";
import { OverviewService } from "./overview.service";
import { CreateOverviewDto } from "./dto/create-overview.dto";
import { UpdateOverviewDto } from "./dto/update-overview.dto";
import { GetRevenueByMonthDto } from "./dto/get-revenue-by-month.dto";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRoles } from "../user/types/user.type";
import { JwtAuthGuard } from "../auth/guards/jwt.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { GetStatisticsDto } from "./dto/get-statistics.dto";

@Controller("overview")
export class OverviewController {
	constructor(private readonly overviewService: OverviewService) {}

	@Post()
	create(@Body() createOverviewDto: CreateOverviewDto) {
		return this.overviewService.create(createOverviewDto);
	}

	@Get()
	@Roles(UserRoles.ADMIN)
	@UseGuards(JwtAuthGuard, RolesGuard)
	async findDataWebShop() {
		return await this.overviewService.findAll();
	}

	@Get("statistics")
	@Roles(UserRoles.ADMIN)
	@UseGuards(JwtAuthGuard, RolesGuard)
	async getStatistics(@Query() dto: GetStatisticsDto) {
		return await this.overviewService.getStatistics(dto);
	}

	@Get(":id")
	findOne(@Param("id") id: string) {
		return this.overviewService.findOne(+id);
	}

	@Patch(":id")
	update(@Param("id") id: string, @Body() updateOverviewDto: UpdateOverviewDto) {
		return this.overviewService.update(+id, updateOverviewDto);
	}

	@Delete(":id")
	remove(@Param("id") id: string) {
		return this.overviewService.remove(+id);
	}

	@Get("revenue/:year")
	async getRevenueByYear(@Param("year") year: string) {
		return await this.overviewService.getRevenueByYear(year);
	}

	@Get("/month/revenue")
	async getRevenueByMonth(@Query() dto: GetRevenueByMonthDto) {
		return await this.overviewService.getDailyRevenueByMonth(dto);
	}
}
