import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { UserModel } from "../user/model/user.model";
import { InjectModel } from "@nestjs/sequelize";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { ChangePassworDto } from "./dto/change-password.dto";
import { validateHash } from "src/common/helpers/hash.helper";
import { UserStatus } from "../user/types/user.type";

@Injectable()
export class AuthService {
	constructor(
		@InjectModel(UserModel) private readonly userRepository: typeof UserModel,
		private jwtService: JwtService,
	) {}
	async validateAdmin(phone: string, password: string) {
		const foundAmdin = await this.userRepository.findOne({
			where: { phone: phone },
		});
		if (!foundAmdin) {
			throw new NotFoundException("Tài khoản không tồn tại");
		}

		if (foundAmdin.status === UserStatus.INACTIVE) {
			throw new BadRequestException("Tài khoản của bạn đã bị khóa!");
		}

		const checkPass = bcrypt.compareSync(password, foundAmdin.password);

		if (checkPass === false) {
			throw new UnauthorizedException("Sai taì khoản hoặc mật khẩu!");
		}

		const payload = {
			id: foundAmdin.id,
			name: foundAmdin.name,
      role: foundAmdin.role,
      email: foundAmdin.email
		};

		const token = await this.jwtService.signAsync(payload);

		await this.userRepository.update(
			{
				token: token,
			},
			{ where: { id: foundAmdin.id } },
		);

		foundAmdin.token = token;

		return foundAmdin;
	}

	async changePassword(dto: ChangePassworDto, req: any) {
		const { old_password, new_password, re_enter_password } = dto;

		// Tìm người dùng dựa trên id từ req
		const user = await this.userRepository.findOne({
			where: { id: req?.user?.id },
		});

		// Kiểm tra nếu người dùng không tồn tại
		if (!user) {
			throw new NotFoundException("Không tồn tại người dùng!");
		}

		// Kiểm tra nhập lại mật khẩu mới có khớp không
		if (new_password !== re_enter_password) {
			throw new BadRequestException("Nhập lại mật khẩu không đúng!");
		}

		// Kiểm tra mật khẩu cũ có khớp không
		const isPasswordValid = bcrypt.compareSync(old_password, user.password);
		if (!isPasswordValid) {
			throw new BadRequestException("Mật khẩu cũ không đúng!");
		}

		// Mã hóa mật khẩu mới và lưu lại
		const SALT = bcrypt.genSaltSync();
		const passwordHash = await bcrypt.hash(new_password, SALT);

		user.password = passwordHash;
		await user.save();

		return {
			message: "Đổi mật khẩu thành công!",
		};
	}
}
