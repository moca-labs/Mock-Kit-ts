export async function bootstrapMock(): Promise<void> {
	if (import.meta.env.VITE_MOCK_ENABLED !== "true") return;
	const { McMockManager } = await import("@moca-labs/mock-kit-ts");
	const { UserApi } = await import("./api/UserApi");
	McMockManager.configure({ status: 200, delay: 300 });
	McMockManager.register(UserApi);
	McMockManager.start();
}
