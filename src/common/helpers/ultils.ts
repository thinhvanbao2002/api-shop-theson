import bcrypt from "bcrypt";

export function getFullUrl(path?: string): string {
	if (!path) {
		return null;
	}

	if (!path.startsWith("http")) {
		return `${process.env.API_BASE_URL}/${path}`;
	}
	return path;
}

export function validateHash(password: string | undefined, hash: string | undefined): Promise<boolean> {
	if (!password || !hash) {
		return Promise.resolve(false);
	}

	return bcrypt.compare(password, hash);
}
export const convertStatus = (status: number) => {
	switch (status) {
		case 1:
			return "Đang hoạt động";
		case 2:
			return "Ngừng hoạt động";
	}
};

export const ORDER_TYPE = {
	PENDING: "1",
	PROCESSING: "2",
	WAITING_FOR_PAYMENT: "3",
	PAID: "4",
	CANCELED: "5",
};

export const ORDER_STATUS = {
	[ORDER_TYPE.PENDING]: {
		text: "Chờ phê duyệt",
	},
	[ORDER_TYPE.PROCESSING]: {
		text: "Đang chuẩn bị hàng",
	},
	[ORDER_TYPE.WAITING_FOR_PAYMENT]: {
		text: "Đang vận chuyển",
	},
	[ORDER_TYPE.PAID]: {
		text: "Đã giao hàng",
	},
	[ORDER_TYPE.CANCELED]: {
		text: "Đã hủy",
	},
};

export const vldOrderStatus = (value: string) => {
	console.log("🚀 ~ vldOrderStatus ~ value:", value);
	return `${ORDER_STATUS[value].text}`;
};
