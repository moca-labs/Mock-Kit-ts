import { describe, expect, it } from "vitest";
import McMockMatcher from "./McMockMatcher";

describe("McMockMatcher", () => {
	it("경로 파라미터를 이름 기준으로 추출한다", () => {
		expect(McMockMatcher.match("/users/{id}", "/users/1")).toEqual({ id: "1" });
	});

	it("절대 URL에서도 pathname만 매칭한다", () => {
		expect(McMockMatcher.match("/users/{id}", "https://api.example.com/users/42?x=1")).toEqual({ id: "42" });
	});

	it("세그먼트 개수가 다르면 매칭하지 않는다", () => {
		expect(McMockMatcher.match("/users/{id}", "/users/1/posts")).toBeNull();
	});

	it("파라미터가 없는 정적 경로도 매칭한다", () => {
		expect(McMockMatcher.match("/users", "/users")).toEqual({});
	});

	it("복수 파라미터를 모두 추출한다", () => {
		expect(McMockMatcher.match("/users/{userId}/posts/{postId}", "/users/1/posts/9")).toEqual({
			userId: "1",
			postId: "9",
		});
	});
});
