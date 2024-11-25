import { Module } from "@nestjs/common";
import { CustomerService } from "./customer.service";
import { CustomerController } from "./customer.controller";
import { SequelizeModule } from "@nestjs/sequelize";
import { CustomerModel } from "./model/customer.model";
import { UserModel } from "../user/model/user.model";
import { CustomerInfoModel } from "../customer-info/model/customer-info.model";
import { CustomerAdminController } from "./admin/customer-admin.controller";
import { CustomerAdminService } from "./admin/customer-admin.service";

@Module({
	imports: [SequelizeModule.forFeature([CustomerModel, UserModel, CustomerInfoModel])],
	controllers: [CustomerController, CustomerAdminController],
	providers: [CustomerService, CustomerAdminService],
})
export class CustomerModule {}
