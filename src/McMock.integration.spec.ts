/** @vitest-environment jsdom */

import { McAxios, McAxiosManager } from "@moca-labs/axios-kit-ts";
import { McEntity } from "@moca-labs/entity-kit-ts";
import { AxiosHeaders } from "axios";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import McMock, { McMockManager } from "./McMock";

@McEntity.ENTITY
class TestUserEntity extends McEntity.Serializable {
	@McEntity.FIELD(String) id!: string;
	@McEntity.FIELD(String) name!: string;
}

class TestUserApi extends McAxios {
	protected header(): AxiosHeaders | undefined {
		return undefined;
	}

	@McAxios.GET("/users/{id}", TestUserEntity)
	@McMock.GET("/users/{id}", { id: "1", name: "김철수" })
	getUser!: (id: string) => Promise<TestUserEntity>;
}

describe("McMock 통합 — 실제 axios-kit/entity-kit 파이프라인", () => {
	beforeAll(() => {
		McMockManager.register(TestUserApi);
		McMockManager.start();
	});

	afterEach(() => {
		McMockManager.resetOverrides();
	});

	it("정상 응답이면 엔티티 필드가 채워진다", async () => {
		const api = McAxiosManager.createMcAxios(new TestUserApi());
		const user = await api.getUser("1");
		expect(user).toBeInstanceOf(TestUserEntity);
		expect(user.id).toBe("1");
		expect(user.name).toBe("김철수");
	});

	it.each([404, 500, 401])("status %i면 에러로 reject된다", async (status) => {
		McMockManager.override("GET", "/users/{id}", { error: "mock error" }, { status });
		const api = McAxiosManager.createMcAxios(new TestUserApi());
		await expect(api.getUser("1")).rejects.toMatchObject({ response: { status } });
	});
});
