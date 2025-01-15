import { BadRequestException, Injectable } from "@nestjs/common";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UserModel } from "./model/user.model";
import { InjectModel } from "@nestjs/sequelize";
import { AdminModel } from "../admin/model/admin.model";
import { ERR_USER } from "./constants/user.constant";
import * as bcrypt from "bcrypt";

@Injectable()
export class UserService {
	constructor(
		@InjectModel(UserModel) private readonly userRepository: typeof UserModel,
		@InjectModel(AdminModel)
		private readonly adminRepository: typeof AdminModel,
	) {}
	async createUser(createUserDto: CreateUserDto) {
		const { phone, email, password } = createUserDto;

		const foundPhone = await this.userRepository.findOne({
			where: { phone: phone },
		});
		const foundEmail = await this.userRepository.findOne({
			where: { email: email },
		});

		if (foundPhone) {
			throw new BadRequestException(ERR_USER.PHONE_EXITS);
		}
		if (foundEmail) {
			throw new BadRequestException(ERR_USER.EMAIL_EXITS);
		}

		const SALT = bcrypt.genSaltSync();

		const passwordHash = await bcrypt.hash(password, SALT);
		const dataUser = await this.userRepository.sequelize.transaction(async transaction => {
			const user = await this.userRepository.create(
				{ ...createUserDto, password: passwordHash },
				{ transaction },
			);

			await this.adminRepository.create({ id: user.id }, { transaction });

			return user;
		});
		return dataUser;
	}

	async getUserInfo(req: any) {
		const userId = req?.user?.id;
		const user = await this.userRepository.findByPk(userId);
		return user;
	}

	findAll() {
		return `This action returns all user`;
	}

	findOne(id: number) {
		return `This action returns a #${id} user`;
	}

	update(id: number, updateUserDto: UpdateUserDto) {
		return `This action updates a #${id} user`;
	}

	remove(id: number) {
		return `This action removes a #${id} user`;
	}
}
