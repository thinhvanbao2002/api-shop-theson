import { Module } from "@nestjs/common";
import { BlogService } from "./blog.service";
import { BlogController } from "./blog.controller";
import { SequelizeModule } from "@nestjs/sequelize";
import { BlogModel } from "./model/blog.model";
import { BlogAdminController } from "./admin/blog-admin.controller";
import { BlogAdminService } from "./admin/blog-admin.service";

@Module({
	imports: [SequelizeModule.forFeature([BlogModel])],
	controllers: [BlogController, BlogAdminController],
	providers: [BlogService, BlogAdminService],
})
export class BlogModule {}
