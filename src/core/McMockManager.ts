import type { McMockOptions } from "../decorators/McMockMethodDecorator";
import McMockInterceptor from "./McMockInterceptor";
import McMockRegistry from "./McMockRegistry";

export default class McMockManager {
	static configure(defaults: McMockOptions): void {
		McMockInterceptor.configure(defaults);
	}

	static register(target: Function): void {
		McMockRegistry.register(target);
	}

	static start(): void {
		McMockInterceptor.install();
	}

	static stop(): void {
		McMockInterceptor.uninstall();
		McMockRegistry.clear();
	}

	static override(method: string, path: string, mock: unknown, options: McMockOptions = {}): void {
		McMockRegistry.override(method, path, mock, options);
	}

	static resetOverrides(): void {
		McMockRegistry.resetOverrides();
	}
}
