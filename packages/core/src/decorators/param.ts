import { registerParamBinding } from "../types/internal";

export const Param =
	(name: string): ParameterDecorator =>
	(target, propertyKey, parameterIndex) => {
		if (propertyKey === undefined) {
			throw new Error("[baget] @Param can only be used on method parameters");
		}
		registerParamBinding(target, propertyKey, parameterIndex, {
			source: "params",
			name,
		});
	};
