import type { McMockOptions } from "../decorators/McMockMethodDecorator";
import McMockRegistry from "./McMockRegistry";

export interface McMockDefaults {
	status?: number;
	delay?: number;
	headers?: Record<string, string>;
}

type PatchedXhr = XMLHttpRequest & { __mcMockMethod?: string; __mcMockUrl?: string };

export default class McMockInterceptor {
	private static defaults: McMockDefaults = {};
	private static originalFetch: typeof fetch | null = null;
	private static originalXhrOpen: typeof XMLHttpRequest.prototype.open | null = null;
	private static originalXhrSend: typeof XMLHttpRequest.prototype.send | null = null;
	private static installed = false;

	static configure(defaults: McMockDefaults): void {
		McMockInterceptor.defaults = defaults;
	}

	static install(): void {
		if (McMockInterceptor.installed) return;
		McMockInterceptor.installed = true;
		McMockInterceptor.patchFetch();
		McMockInterceptor.patchXhr();
	}

	static uninstall(): void {
		if (!McMockInterceptor.installed) return;
		McMockInterceptor.installed = false;
		if (McMockInterceptor.originalFetch) {
			globalThis.fetch = McMockInterceptor.originalFetch;
			McMockInterceptor.originalFetch = null;
		}
		if (McMockInterceptor.originalXhrOpen) {
			XMLHttpRequest.prototype.open = McMockInterceptor.originalXhrOpen;
			McMockInterceptor.originalXhrOpen = null;
		}
		if (McMockInterceptor.originalXhrSend) {
			XMLHttpRequest.prototype.send = McMockInterceptor.originalXhrSend;
			McMockInterceptor.originalXhrSend = null;
		}
	}

	private static buildResponse(mockValue: unknown, options: McMockOptions): Response {
		const status = options.status ?? McMockInterceptor.defaults.status ?? 200;
		const headers = {
			"content-type": "application/json",
			...McMockInterceptor.defaults.headers,
			...options.headers,
		};
		return new Response(JSON.stringify(mockValue ?? null), { status, headers });
	}

	private static resolveMock(mock: unknown, params: Record<string, string>): unknown {
		return typeof mock === "function" ? (mock as (...args: unknown[]) => unknown)(...Object.values(params)) : mock;
	}

	private static async delay(options: McMockOptions): Promise<void> {
		const ms = options.delay ?? McMockInterceptor.defaults.delay ?? 0;
		if (ms > 0) await new Promise((resolve) => setTimeout(resolve, ms));
	}

	private static patchFetch(): void {
		McMockInterceptor.originalFetch = globalThis.fetch.bind(globalThis);
		const original = McMockInterceptor.originalFetch;
		globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
			const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
			const method = (init?.method ?? "GET").toUpperCase();
			const matched = McMockRegistry.match(method, url);
			if (!matched) return original(input, init);
			await McMockInterceptor.delay(matched.entry.options);
			return McMockInterceptor.buildResponse(McMockInterceptor.resolveMock(matched.entry.mock, matched.params), matched.entry.options);
		};
	}

	private static patchXhr(): void {
		McMockInterceptor.originalXhrOpen = XMLHttpRequest.prototype.open;
		McMockInterceptor.originalXhrSend = XMLHttpRequest.prototype.send;
		const originalOpen = McMockInterceptor.originalXhrOpen;
		const originalSend = McMockInterceptor.originalXhrSend;

		XMLHttpRequest.prototype.open = function patchedOpen(this: PatchedXhr, method: string, url: string | URL, ...rest: unknown[]) {
			this.__mcMockMethod = method.toUpperCase();
			this.__mcMockUrl = url.toString();
			return (originalOpen as (...args: unknown[]) => unknown).apply(this, [method, url, ...rest]);
		};

		XMLHttpRequest.prototype.send = function patchedSend(this: PatchedXhr, ...args: unknown[]) {
			const method = this.__mcMockMethod ?? "GET";
			const url = this.__mcMockUrl ?? "";
			const matched = McMockRegistry.match(method, url);
			if (!matched) {
				return (originalSend as (...args: unknown[]) => unknown).apply(this, args);
			}

			McMockInterceptor.delay(matched.entry.options).then(() => {
				const body = JSON.stringify(McMockInterceptor.resolveMock(matched.entry.mock, matched.params) ?? null);
				const status = matched.entry.options.status ?? McMockInterceptor.defaults.status ?? 200;
				Object.defineProperty(this, "readyState", { value: 4, configurable: true });
				Object.defineProperty(this, "status", { value: status, configurable: true });
				Object.defineProperty(this, "responseText", { value: body, configurable: true });
				Object.defineProperty(this, "response", { value: body, configurable: true });
				this.dispatchEvent(new Event("readystatechange"));
				this.dispatchEvent(new Event("load"));
				this.dispatchEvent(new Event("loadend"));
			});
			return undefined;
		};
	}
}
