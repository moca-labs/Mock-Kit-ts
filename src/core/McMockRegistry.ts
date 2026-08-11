import type { McMockEntry, McMockOptions } from "../decorators/McMockMethodDecorator";
import { MC_MOCK_ROUTES } from "../decorators/McMockMethodDecorator";
import McMockMatcher from "./McMockMatcher";

export interface McMockMatch {
	entry: McMockEntry;
	params: Record<string, string>;
}

export default class McMockRegistry {
	private static routes: McMockEntry[] = [];
	private static overrides: McMockEntry[] = [];

	static register(target: Function): void {
		const metadata = (target as { [Symbol.metadata]?: Record<symbol, unknown> })[Symbol.metadata];
		const routes = (metadata?.[MC_MOCK_ROUTES] as McMockEntry[] | undefined) ?? [];
		McMockRegistry.routes.push(...routes);
	}

	static override(method: string, path: string, mock: unknown, options: McMockOptions = {}): void {
		McMockRegistry.overrides.push({ method, path, mock, options });
	}

	static resetOverrides(): void {
		McMockRegistry.overrides = [];
	}

	static clear(): void {
		McMockRegistry.routes = [];
		McMockRegistry.overrides = [];
	}

	static match(method: string, url: string): McMockMatch | null {
		for (const list of [McMockRegistry.overrides, McMockRegistry.routes]) {
			for (let i = list.length - 1; i >= 0; i -= 1) {
				const entry = list[i];
				if (entry.method !== method) continue;
				const params = McMockMatcher.match(entry.path, url);
				if (params) return { entry, params };
			}
		}
		return null;
	}
}
