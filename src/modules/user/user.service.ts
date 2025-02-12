import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UserModel } from "./model/user.model";
import { InjectModel } from "@nestjs/sequelize";
import { AdminModel } from "../admin/model/admin.model";
import { ERR_USER } from "./constants/user.constant";
import * as bcrypt from "bcrypt";
import { Op } from "sequelize";
import { UserRoles } from "./types/user.type";

@Injectable()
export class UserService {
	constructor(
		@InjectModel(UserModel) private readonly userRepository: typeof UserModel,
		@InjectModel(AdminModel)
		private readonly adminRepository: typeof AdminModel,
	) {}
	async createUser(createUserDto: CreateUserDto) {
		const { phone, email, password } = createUserDto;
		console.log("🚀 ~ UserService ~ createUser ~ phone:", phone);
		console.log("🚀 ~ UserService ~ createUser ~ password:", password);
		console.log("🚀 ~ UserService ~ createUser ~ email:", email);

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
		console.log("🚀 ~ UserService ~ createUser ~ passwordHash:", passwordHash);
		const dataUser = await this.userRepository.sequelize.transaction(async transaction => {
			const user = await this.userRepository.create(
				{ ...createUserDto, password: passwordHash, role: UserRoles.CUSTOMER },
				{ transaction },
			);
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

	async update(id: number, updateUserDto: UpdateUserDto) {
		const { name, avatar, password, newPassword } = updateUserDto;
		await this.userRepository.update({ name, avatar }, { where: { id: { [Op.eq]: id } } });

		// Tìm người dùng dựa trên id từ req
		const user = await this.userRepository.findOne({
			where: { id: id },
		});
		console.log("🚀 ~ UserService ~ update ~ user:", user.avatar);

		// Kiểm tra nếu người dùng không tồn tại
		if (!user) {
			throw new NotFoundException("Không tồn tại người dùng!");
		}

		if (password && newPassword) {
			// Kiểm tra mật khẩu cũ có khớp không
			const isPasswordValid = bcrypt.compareSync(password, user.password);
			if (!isPasswordValid) {
				throw new BadRequestException("Mật khẩu cũ không đúng!");
			}

			// Mã hóa mật khẩu mới và lưu lại
			const SALT = bcrypt.genSaltSync();
			const passwordHash = await bcrypt.hash(newPassword, SALT);

			user.password = passwordHash;
			await user.save();
		}
	}

	remove(id: number) {
		return `This action removes a #${id} user`;
	}
}
