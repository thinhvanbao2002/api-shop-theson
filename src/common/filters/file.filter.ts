import { BadRequestException } from "@nestjs/common";

export const imageFileFilter = (req: any, file: any, callback: any) => {
	if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
		return callback(new BadRequestException("Định dạng file jpg, jpeg, png!"), false);
	}
	callback(null, true);
};
export const videoFileFilter = (req: any, file: any, callback: any) => {
	if (!file.originalname.match(/\.(mp4|avi|wmv|mkv|flv|webm)$/)) {
		return callback(new BadRequestException("Không đúng định dạng video!"), false);
	}
	callback(null, true);
};
