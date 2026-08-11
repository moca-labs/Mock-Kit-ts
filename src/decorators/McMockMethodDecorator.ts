if (typeof (Symbol as { metadata?: symbol }).metadata === "undefined") {
	(Symbol as { metadata?: symbol }).metadata = Symbol.for("Symbol.metadata");
}

export interface McMockOptions {
	status?: number;
	delay?: number;
	headers?: Record<string, string>;
}

export interface McMockEntry {
	method: string;
	path: string;
	mock: unknown;
	options: McMockOptions;
}

export const MC_MOCK_ROUTES = Symbol("mc-mock:routes");

type McMockDecoratorContext = ClassMethodDecoratorContext | ClassFieldDecoratorContext;

function createMockDecorator(method: string) {
	return (path: string, mock: unknown, options: McMockOptions = {}) =>
		(_value: unknown, context: McMockDecoratorContext): void => {
			const metadata = context.metadata as Record<symbol, unknown>;
			const routes = (metadata[MC_MOCK_ROUTES] as McMockEntry[] | undefined) ?? [];
			if (!Object.hasOwn(metadata, MC_MOCK_ROUTES)) {
				metadata[MC_MOCK_ROUTES] = routes;
			}
			routes.push({ method, path, mock, options });
		};
}

export const GET = createMockDecorator("GET");
export const POST = createMockDecorator("POST");
export const PUT = createMockDecorator("PUT");
export const PATCH = createMockDecorator("PATCH");
export const DELETE = createMockDecorator("DELETE");
