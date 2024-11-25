/* eslint-disable @typescript-eslint/ban-types */
import { applyDecorators } from "@nestjs/common";
import type { ApiPropertyOptions } from "@nestjs/swagger";
import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";

import {
	ArrayMaxSize,
	ArrayMinSize,
	ArrayNotEmpty,
	IsArray,
	IsBoolean,
	IsDate,
	IsDateString,
	IsEmail,
	IsEnum,
	IsInt,
	IsNotEmpty,
	IsNumber,
	IsNumberString,
	IsOptional,
	IsPositive,
	IsString,
	IsUrl,
	IsUUID,
	Max,
	MaxLength,
	Min,
	MinLength,
	ValidateNested,
	ValidationOptions,
} from "class-validator";
import { DATE_FORMAT_STRING } from "../../common/helpers/date.helper";
import { supportedLanguageCount } from "../../common/types/language-code";
import * as _ from "lodash";
import moment from "moment";

import { ApiEnumProperty, ApiUUIDProperty } from "./property.decorators";
import {
	PhoneNumberNationalSerializer,
	ToArray,
	ToBoolean,
	ToLowerCase,
	ToUpperCase,
	Trim,
} from "./transform.decorators";
import { IsPassword, IsTmpKey } from "./validator.decorators";

type RequireField<T, K extends keyof T> = T & Required<Pick<T, K>>;

interface IStringFieldOptions {
	minLength?: number;
	maxLength?: number;
	toLowerCase?: boolean;
	toUpperCase?: boolean;
	swagger?: boolean;
	notEmpty?: boolean;
}

interface INumberFieldOptions {
	each?: boolean;
	minimum?: number;
	maximum?: number;
	int?: boolean;
	isPositive?: boolean;
	swagger?: boolean;
}

// export function NumberField(options: Omit<ApiPropertyOptions, 'type'> & INumberFieldOptions = {}): PropertyDecorator {
//   const decorators = [Type(() => Number)];

//   // eslint-disable-next-line @typescript-eslint/naming-convention
//   const { each, int, minimum, maximum, isPositive, swagger } = options;

//   if (options.isArray) {
//     decorators.push(IsArray());
//   }

//   const isArray = options.isArray || options.each;

//   if (swagger !== false) {
//     const example = int ? 1 : 1.2;
//     decorators.push(
//       ApiProperty({ type: isArray ? [Number] : Number, example: isArray ? [example] : example, ...options }),
//     );
//   }

//   if (each) {
//     decorators.push(ToArray());
//   }

//   if (int) {
//     decorators.push(IsInt({ each }));
//   } else {
//     decorators.push(IsNumber({}, { each }));
//   }

//   if (_.isNumber(minimum)) {
//     decorators.push(Min(minimum, { each }));
//   }

//   if (_.isNumber(maximum)) {
//     decorators.push(Max(maximum, { each }));
//   }

//   if (isPositive) {
//     decorators.push(IsPositive({ each }));
//   }

//   return applyDecorators(...decorators);
// }

export function NumberField(options: Omit<ApiPropertyOptions, "type"> & INumberFieldOptions = {}): PropertyDecorator {
	const decorators = [Type(() => Number)];

	// eslint-disable-next-line @typescript-eslint/naming-convention
	const { each, int, minimum, maximum, isPositive, swagger } = options;

	if (swagger !== false) {
		decorators.push(ApiProperty({ type: Number, example: int ? 1 : 1.2, ...options }));
	}

	if (each) {
		decorators.push(ToArray());
	}

	if (int) {
		decorators.push(IsInt({ each }));
	} else {
		decorators.push(IsNumber({}, { each }));
	}

	if (_.isNumber(minimum)) {
		decorators.push(Min(minimum, { each }));
	}

	if (_.isNumber(maximum)) {
		decorators.push(Max(maximum, { each }));
	}

	if (isPositive) {
		decorators.push(IsPositive({ each }));
	}

	return applyDecorators(...decorators);
}
export function NumberFieldOptional(
	options: Omit<ApiPropertyOptions, "type" | "required"> & Partial<INumberFieldOptions> = {},
): PropertyDecorator {
	return applyDecorators(IsOptional(), NumberField({ required: false, ...options }));
}

export function StringField(options: Omit<ApiPropertyOptions, "type"> & IStringFieldOptions = {}): PropertyDecorator {
	const decorators = [IsString(), Trim()];

	if (options.notEmpty) {
		decorators.push(IsNotEmpty());
	}

	const isArray = options.isArray;
	if (options.swagger !== false) {
		decorators.push(ApiProperty({ type: isArray ? [String] : String, ...options }));
	}

	if (options.isArray) {
		decorators.push(IsArray());
	}

	if (options.minLength) {
		decorators.push(MinLength(options.minLength));
	}

	if (options.maxLength) {
		decorators.push(MaxLength(options.maxLength));
	}

	if (options.toLowerCase) {
		decorators.push(ToLowerCase());
	}

	if (options.toUpperCase) {
		decorators.push(ToUpperCase());
	}

	return applyDecorators(...decorators);
}

export function StringFieldOptional(
	options: Omit<ApiPropertyOptions, "type" | "required"> & IStringFieldOptions = {},
): PropertyDecorator {
	return applyDecorators(IsOptional(), StringField({ required: false, ...options }));
}

export function PasswordField(
	options: Omit<ApiPropertyOptions, "type" | "minLength"> & IStringFieldOptions = {},
): PropertyDecorator {
	return applyDecorators(StringField({ format: "^[\\d!#$%&*@A-Z^a-z]*$", ...options }), IsPassword());
}

export function PasswordFieldOptional(
	options: Omit<ApiPropertyOptions, "type" | "required" | "minLength"> & IStringFieldOptions = {},
): PropertyDecorator {
	return applyDecorators(IsOptional(), PasswordField({ required: false, ...options }));
}

export function BooleanField(
	options: Omit<ApiPropertyOptions, "type"> & Partial<{ swagger: boolean }> = {},
): PropertyDecorator {
	const decorators = [IsBoolean(), ToBoolean()];

	if (options.swagger !== false) {
		decorators.push(ApiProperty({ type: Boolean, ...options }));
	}

	return applyDecorators(...decorators);
}

export function BooleanFieldOptional(
	options: Omit<ApiPropertyOptions, "type" | "required"> & Partial<{ swagger: boolean }> = {},
): PropertyDecorator {
	return applyDecorators(IsOptional(), BooleanField({ required: false, ...options }));
}

export function TranslationsField(
	options: RequireField<Omit<ApiPropertyOptions, "isArray">, "type"> & Partial<{ swagger: boolean }>,
): PropertyDecorator {
	const decorators = [
		ArrayMinSize(supportedLanguageCount),
		ArrayMaxSize(supportedLanguageCount),
		ValidateNested({
			each: true,
		}),
		Type(() => options.type as FunctionConstructor),
	];

	if (options.swagger !== false) {
		decorators.push(ApiProperty({ isArray: true, ...options }));
	}

	return applyDecorators(...decorators);
}

export function TranslationsFieldOptional(
	options: RequireField<Omit<ApiPropertyOptions, "isArray">, "type"> & Partial<{ swagger: boolean }>,
): PropertyDecorator {
	return applyDecorators(IsOptional(), TranslationsField({ required: false, ...options }));
}

export function TmpKeyField(
	options: Omit<ApiPropertyOptions, "type"> & Partial<{ swagger: boolean }> = {},
): PropertyDecorator {
	const decorators = [IsTmpKey()];

	if (options.swagger !== false) {
		decorators.push(ApiProperty({ type: String, ...options }));
	}

	return applyDecorators(...decorators);
}

export function TmpKeyFieldOptional(
	options: Omit<ApiPropertyOptions, "type" | "required"> & Partial<{ swagger: boolean }> = {},
): PropertyDecorator {
	return applyDecorators(IsOptional(), TmpKeyField({ required: false, ...options }));
}

export function EnumField<TEnum>(
	getEnum: () => TEnum,
	options: Omit<ApiPropertyOptions, "type" | "enum" | "enumName"> &
		Partial<{
			each: boolean;
			swagger: boolean;
			message: string;
		}> = {},
): PropertyDecorator {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const enumValue = getEnum() as any;
	const validationOptions: ValidationOptions = {
		each: options.each,
		message: options.message,
	};

	if (!validationOptions.message) {
		validationOptions.message = args => `${args.property} must be one of ${Object.values(enumValue).join(", ")}`;
	}

	const decorators = [IsEnum(enumValue as object, validationOptions)];

	if (options.swagger !== false) {
		decorators.push(ApiEnumProperty(getEnum, options));
	}

	if (options.each) {
		decorators.push(ToArray());
	}

	return applyDecorators(...decorators);
}

export function EnumFieldOptional<TEnum>(
	getEnum: () => TEnum,
	options: Omit<ApiPropertyOptions, "type" | "required" | "enum" | "enumName"> &
		Partial<{ each: boolean; swagger: boolean }> = {},
): PropertyDecorator {
	return applyDecorators(IsOptional(), EnumField(getEnum, { required: false, ...options }));
}

export function EmailField(options: Omit<ApiPropertyOptions, "type"> & IStringFieldOptions = {}): PropertyDecorator {
	const decorators = [IsEmail(), StringField({ toLowerCase: true, ...options })];

	if (options.swagger !== false) {
		decorators.push(ApiProperty({ type: String, ...options }));
	}

	return applyDecorators(...decorators);
}

export function EmailFieldOptional(
	options: Omit<ApiPropertyOptions, "type"> & IStringFieldOptions = {},
): PropertyDecorator {
	return applyDecorators(IsOptional(), EmailField({ required: false, ...options }));
}

export function PhoneField(
	options: Omit<ApiPropertyOptions, "type"> & Partial<{ swagger: boolean }> = {},
): PropertyDecorator {
	const decorators = [IsNumberString({}, { message: "Số điện thoại không hợp lệ" }), PhoneNumberNationalSerializer()];

	if (options.swagger !== false) {
		decorators.push(ApiProperty({ type: String, ...options }));
	}

	return applyDecorators(...decorators);
}

export function PhoneFieldOptional(
	options: Omit<ApiPropertyOptions, "type" | "required"> & Partial<{ swagger: boolean }> = {},
): PropertyDecorator {
	return applyDecorators(IsOptional(), PhoneField({ required: false, ...options }));
}

export function UUIDField(
	options: Omit<ApiPropertyOptions, "type" | "format"> & Partial<{ each: boolean; swagger: boolean }> = {},
): PropertyDecorator {
	const decorators = [IsUUID("4", { each: options.each })];

	if (options.swagger !== false) {
		decorators.push(ApiUUIDProperty(options));
	}

	if (options.each) {
		decorators.push(ArrayNotEmpty(), ToArray());
	}

	return applyDecorators(...decorators);
}

export function UUIDFieldOptional(
	options: Omit<ApiPropertyOptions, "type" | "required"> & Partial<{ each: boolean; swagger: boolean }> = {},
): PropertyDecorator {
	return applyDecorators(IsOptional(), UUIDField({ required: false, ...options }));
}

export function URLField(options: Omit<ApiPropertyOptions, "type"> & IStringFieldOptions = {}): PropertyDecorator {
	return applyDecorators(StringField(options), IsUrl());
}

export function URLFieldOptional(
	options: Omit<ApiPropertyOptions, "type"> & IStringFieldOptions = {},
): PropertyDecorator {
	return applyDecorators(IsOptional(), URLField({ required: false, ...options }));
}

export function DateStringField(
	options: Omit<ApiPropertyOptions, "type"> & Partial<{ swagger: boolean; includeTime: boolean }> = {},
): PropertyDecorator {
	const decorators = [IsDateString({ strict: true }, { message: "Invalid date format. Use YYYY-MM-DD." })];
	// Date only
	if (!options.includeTime) {
		decorators.push(MaxLength(10, { message: "Invalid date format. Use YYYY-MM-DD." }));
	}

	if (options.swagger !== false) {
		decorators.push(ApiProperty({ example: moment().format(DATE_FORMAT_STRING), ...options }));
	}

	return applyDecorators(...decorators);
}

export function DateStringFieldOptional(
	options: Omit<ApiPropertyOptions, "type" | "required"> & Partial<{ swagger: false }> = {},
): PropertyDecorator {
	return applyDecorators(IsOptional(), DateStringField({ ...options, required: false }));
}

export function DateField(
	options: Omit<ApiPropertyOptions, "type"> & Partial<{ swagger: false }> = {},
): PropertyDecorator {
	const decorators = [Type(() => Date), IsDate()];

	if (options.swagger !== false) {
		decorators.push(ApiProperty(options));
	}

	return applyDecorators(...decorators);
}

export function DateFieldOptional(
	options: Omit<ApiPropertyOptions, "type" | "required"> & Partial<{ swagger: false }> = {},
): PropertyDecorator {
	return applyDecorators(IsOptional(), DateField({ ...options, required: false }));
}
