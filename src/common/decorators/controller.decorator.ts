import { applyDecorators, Controller } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

export function GenericController(name: string, options: { secured?: boolean; tag?: string } = { secured: true }) {
	const tagName: string = options?.tag || name.toLowerCase();
	const decsToApply = [ApiTags(tagName), Controller(name)];

	return applyDecorators(...decsToApply);
}
