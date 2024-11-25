import { Injectable } from "@nestjs/common";
import { CreateNewDto } from "./dto/create-new.dto";
import { UpdateNewDto } from "./dto/update-new.dto";

@Injectable()
export class NewService {
	create(createNewDto: CreateNewDto) {
		return "This action adds a new new";
	}

	findAll() {
		return `This action returns all new`;
	}

	findOne(id: number) {
		return `This action returns a #${id} new`;
	}

	update(id: number, updateNewDto: UpdateNewDto) {
		return `This action updates a #${id} new`;
	}

	remove(id: number) {
		return `This action removes a #${id} new`;
	}
}
