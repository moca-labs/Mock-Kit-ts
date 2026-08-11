import { McAxios } from "@moca-labs/axios-kit-ts";
import { McEntity } from "@moca-labs/entity-kit-ts";
import McMock from "@moca-labs/mock-kit-ts";
import { AxiosHeaders } from "axios";
import { UserEntity } from "./UserEntity";

// mock data
import { userProfileFixture } from "../fixtures/user.mock";

export class CreateUserRequest extends McAxios.Request {
	@McEntity.SERIALIZE name!: string;

	constructor(name: string) {
		super();
		this.name = name;
	}
}

export class UserApi extends McAxios {
	protected header(): AxiosHeaders | undefined {
		return undefined;
	}

	// S01 — GET
	@McAxios.GET("/users/{id}", UserEntity)
	@McMock.GET("/users/{id}", { id: "1", name: "김철수" })
	getUser!: (id: string) => Promise<UserEntity>;

	// S02 — POST. mock-kit은 현재 요청 body를 mock 함수에 반영하지 못합니다(설계상 미지원,
	// ISSUES.md M-3 "미해결로 남긴 것" 참조) — 무엇을 보내든 같은 정적 응답이 돌아옵니다.
	@McAxios.POST("/users", UserEntity)
	@McAxios.REQUEST("body", 0)
	@McMock.POST("/users", { id: "99", name: "새 사용자" }, { status: 201 })
	createUser!: (body: CreateUserRequest) => Promise<UserEntity>;

	// S02b — 런타임 override(McMockManager.override, S04 참조) 없이도 데코레이터의 options.status만으로
	// 고정 에러를 시뮬레이션할 수 있다. 단, 같은 method+path에 mock을 두 개 이상 등록할 순 없다
	// (McMockRegistry는 method+path로만 매칭하며 나중에 등록된 쪽이 이긴다) — 그래서 별도 경로를 쓴다.
	@McAxios.POST("/users/invalid", UserEntity)
	@McAxios.REQUEST("body", 0)
	@McMock.POST("/users/invalid", { error: "invalid payload" }, { status: 404 })
	createInvalidUser!: (body: CreateUserRequest) => Promise<UserEntity>;

	// S03 — 응답을 fixture 파일에서 가져옴 (mock-kit 쪽 기능 추가 없이 평범한 ES import)
	@McAxios.GET("/users/{id}/profile", UserEntity)
	@McMock.GET("/users/{id}/profile", userProfileFixture)
	getUserProfile!: (id: string) => Promise<UserEntity>;
}
