import { registerParamBinding } from "../types/internal";

export const Body =
	(name?: string): ParameterDecorator =>
	(target, propertyKey, parameterIndex) => {
		if (propertyKey === undefined) {
			throw new Error("[baget] @Body can only be used on method parameters");
		}
		registerParamBinding(target, propertyKey, parameterIndex, {
			source: "body",
			name,
		});
	};
