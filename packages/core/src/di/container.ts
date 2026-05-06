import { METADATA_KEYS } from "../constants";
import { type Constructor, getMeta, type Token } from "../types/internal";

export type ProviderFactory<T> = (oven: Oven) => T;

export class Oven {
	private instances = new Map<Token, unknown>();
	private factories = new Map<Token, ProviderFactory<unknown>>();

	provide<T>(token: Token<T>, instance: T): void {
		this.instances.set(token, instance);
	}

	factory<T>(token: Token<T>, factory: ProviderFactory<T>): void {
		this.factories.set(token, factory as ProviderFactory<unknown>);
	}

	resolve<T extends object>(target: Constructor<T>): T {
		const cached = this.instances.get(target);
		if (cached !== undefined) return cached as T;

		const factory = this.factories.get(target);
		if (factory) {
			const instance = factory(this) as T;
			this.instances.set(target, instance);
			return instance;
		}

		this.assertInjectable(target);

		const explicitInjects = getMeta(METADATA_KEYS.INJECT, target) ?? [];
		const expected = target.length;

		const injections: unknown[] = [];
		for (let i = 0; i < expected; i++) {
			const token = explicitInjects[i];
			if (token === undefined) {
				throw new Error(
					`[baget] Cannot resolve constructor parameter #${i} of ${target.name} — add \`@Inject(Token)\` on it.`,
				);
			}
			injections.push(this.resolve(token as Constructor<object>));
		}

		const instance = new target(...(injections as unknown[]));
		this.instances.set(target, instance);
		return instance;
	}

	private assertInjectable(target: Constructor): void {
		const isInjectable = getMeta(METADATA_KEYS.INJECTABLE, target) === true;
		const isController =
			getMeta(METADATA_KEYS.CONTROLLER, target) !== undefined;
		if (!isInjectable && !isController) {
			throw new Error(
				`[baget] ${target.name || "anonymous class"} cannot be resolved by the Oven — did you forget @Injectable() or @Controller()?`,
			);
		}
	}
}

export const defaultOven = new Oven();
