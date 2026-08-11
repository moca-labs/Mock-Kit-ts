# @moca-labs/mock-kit-ts

`Axios-Kit-ts`로 만든 API 클래스 위에 그대로 얹어서, **백엔드가 없어도 화면부터 만들 수 있게 해주는** mock 라이브러리입니다.

---

## 왜 필요한가

백엔드 API가 아직 없어도 화면 개발을 시작할 수 있습니다. API 스펙만 합의되면 프론트와 백엔드가 병렬로 진행됩니다. 데모·영업 시연 빌드를 네트워크 없이도 완전히 동작하게 만들 수 있고, 로딩 스피너나 에러 화면처럼 실제 백엔드로는 재현하기 번거로운 상태도 옵션 하나로 즉시 확인할 수 있습니다.

`axios-kit`을 이미 쓰고 있다면 새로 배울 게 거의 없습니다 — `@McAxios.GET` 옆에 `@McMock.GET`을 한 줄 얹는 것뿐입니다. 화면 코드는 mock이 켜져 있는지 전혀 모릅니다.

이 라이브러리의 1차 목적은 **테스트가 아니라 화면 개발**입니다. 요청을 정확히 재현하는 도구가 아니라 "화면이 이렇게 보인다"를 먼저 확정하는 도구입니다 — mock 값은 정적인 게 기본이고, 요청을 가짜로 반영하는 기능은 최소한만 있습니다.

## 설치

```bash
npm install --save-dev @moca-labs/mock-kit-ts
```

`@moca-labs/axios-kit-ts`가 **필수 peer**입니다 — 먼저 설치·구성돼 있어야 합니다. `@moca-labs/entity-kit-ts`는 axios-kit이 이미 필수로 요구하므로 따로 설치할 필요가 없습니다.

## 빠른 시작

### 1. 엔티티를 정의합니다 (`entity-kit`)

**`@McEntity.ENTITY`를 빼먹지 마십시오.** `McSerializable`만 상속해서는 필드가 채워지지 않습니다 — `@McEntity.ENTITY`가 JSON → 필드 매핑 로직을 생성자에 주입합니다.

```ts
@McEntity.ENTITY
class UserEntity extends McEntity.Serializable {
  @McEntity.FIELD(String) id!: string;
  @McEntity.FIELD(String) name!: string;
}
```

### 2. API 클래스에 실제 선언과 mock을 함께 얹습니다

```ts
import { McAxios } from "@moca-labs/axios-kit-ts";
import McMock from "@moca-labs/mock-kit-ts";
import { AxiosHeaders } from "axios";

class UserApi extends McAxios {
  // McAxiosCore의 추상 메서드 — 모든 McAxios 파생 클래스가 반드시 구현해야 합니다.
  // (mock-kit과 무관한 axios-kit 자체의 요구사항입니다. 헤더가 필요 없으면 undefined를 반환하세요.)
  protected header(): AxiosHeaders | undefined {
    return undefined;
  }

  // @McAxios.GET의 2번째 인자(응답 엔티티 타입)는 필수입니다 — 생략할 수 없습니다.
  @McAxios.GET("/users/{id}", UserEntity)
  @McMock.GET("/users/{id}", { id: "1", name: "김철수" }, { delay: 300 })
  getUser!: (id: string) => Promise<UserEntity>;
}
```

`@McAxios.GET`이 실제 엔드포인트를 등록하고, `@McMock.GET`이 그 위에 mock 응답을 얹습니다. **둘 다 항상 같이 씁니다** — mock-kit만 단독으로 쓰는 방식은 없습니다(axios-kit이 필수 peer입니다).

경로 파라미터는 axios-kit과 동일하게 `{id}` 표기를 쓰고, 파라미터 이름이 같으면 자동으로 매칭됩니다. `getUser(id: string)`처럼 **파라미터에 데코레이터를 붙이지 않습니다** — TC39 데코레이터엔 파라미터 데코레이터 자체가 없습니다.

### 3. 부트스트랩에서 켭니다

```ts
// bootstrap.ts
if (import.meta.env.DEV) {
  const { McMockManager } = await import("@moca-labs/mock-kit-ts");
  const { UserApi } = await import("./api/UserApi");

  McMockManager.configure({ status: 200, delay: 300 }); // 전역 기본값
  McMockManager.register(UserApi); // 클래스 자체를 등록 — 인스턴스화 불필요
  McMockManager.start(); // fetch/XHR 인터셉트 설치
}
```

동적 import + `import.meta.env.DEV` 가드를 반드시 쓰십시오 — `McMockManager.register`/`start` 호출이 프로덕션에서 실행되지 않아 인터셉트가 활성화되지 않습니다.

> ⚠️ 다만 `@McMock.*` 데코레이터 호출과 그 mock 값 자체는 실제 엔드포인트 클래스와 같은 파일에 있어 **번들에는 포함됩니다** — 데코레이터는 클래스 정의 시점에 즉시 실행되는 코드라 동적 import로 감쌀 수 없기 때문입니다. 위 가드가 막아주는 건 "인터셉트 활성화"뿐입니다. mock 데이터까지 완전히 빼려면 API 클래스 자체를 dev 전용 모듈로 분리해야 하고, 그러면 실제 엔드포인트도 함께 동적 로드해야 합니다 — 이 라이브러리의 기본 권장 사항은 아닙니다.

### 4. 화면 코드는 그대로 둡니다

```ts
const userApi = McAxiosManager.createMcAxios(new UserApi());
const user = await userApi.getUser("1"); // mock이 켜져 있으면 목 데이터, 꺼져 있으면 실제 API
```

mock 여부와 무관하게 한 글자도 안 바뀝니다.

## POST 등 body가 있는 요청

**body 인자는 반드시 `McRequest`(=`McAxios.Request`) 서브클래스여야 합니다.** 평범한 객체를 그대로 넘기면 axios-kit이 런타임에 `.toJson is not a function`으로 실패합니다 — `@McAxios.REQUEST`로 body 위치를 지정해도 마찬가지입니다(axios-kit이 그 인자를 무조건 `McRequest`로 캐스팅해 `.toJson()`을 호출하기 때문). `@McEntity.SERIALIZE`로 필드를 표시하면 됩니다.

```ts
import { McEntity } from "@moca-labs/entity-kit-ts";

class CreateUserRequest extends McAxios.Request {
  @McEntity.SERIALIZE name!: string;

  constructor(name: string) {
    super();
    this.name = name;
  }
}

class UserApi extends McAxios {
  protected header(): AxiosHeaders | undefined { return undefined; }

  @McAxios.POST("/users", UserEntity)
  @McAxios.REQUEST("body", 0)
  @McMock.POST("/users", { id: "99", name: "새 사용자" }, { status: 201 })
  createUser!: (body: CreateUserRequest) => Promise<UserEntity>;
}
```

**mock-kit은 request body를 mock 함수에 반영하지 못합니다** — `createUser(new CreateUserRequest("아무개"))`를 호출해도 mock 응답은 항상 같은 값입니다. 함수형 `mock`이 받는 인자는 **path 파라미터뿐**입니다(아래 "알려진 제한" 참조).

## 옵션

`options`는 `{ status?, delay?, headers? }`입니다.

- `status` — 기본 200
- `delay` — ms, 기본 0. 로딩 스피너 확인용
- `headers` — 기본 `{ "content-type": "application/json" }`

**`status`/`headers`는 mock JSON 본문에 넣지 않습니다.** `AxiosResponse`의 이 필드들은 axios가 raw HTTP 응답의 상태 줄·헤더에서 직접 읽으므로, `options`로만 지정하면 됩니다.

## API 레퍼런스

### 데코레이터

| 데코레이터 | 역할 |
|---|---|
| `@McMock.GET/POST/PUT/PATCH/DELETE(path, mock, options?)` | mock 등록. `mock`은 값 또는 `(...pathParams) => value` 함수(기본은 정적 값). `options` 생략 시 `McMockManager.configure()`의 전역 기본값 사용 |

### `McMockManager`

```ts
McMockManager.configure({ status?, delay?, headers? })   // 전역 기본값
McMockManager.register(SomeApiClass)                      // 클래스 자체를 등록 — 인스턴스화 불필요
McMockManager.start()                                      // fetch/XHR 인터셉트 설치
McMockManager.stop()                                        // 인터셉트 해제 + 등록 초기화
McMockManager.override(method, path, mock, options?)       // 런타임 임시 오버라이드 — 테스트 등 부차적 용도
McMockManager.resetOverrides()
```

## 자주 쓰는 패턴

- **정적 값이 기본입니다.** 요청 인자를 반영해야 할 때만 함수로 바꿉니다: `@McMock.GET("/users/{id}", (id) => ({ id, name: "김철수" }))`.
- **에러·지연 시뮬레이션**: `{ status: 404 }`, `{ delay: 2000 }`.
- **시나리오 전환**: 런타임 API 없이, 데코레이터의 값을 직접 고쳐 저장하면 Vite HMR이 즉시 반영합니다.
- **큰 데이터는 파일로 분리**: 평범한 ES 모듈 import로 충분합니다 — mock-kit 쪽에 별도 "파일 로더" 기능은 없습니다. `.ts`로 빼면 타입 체크를, `.json`으로 빼면 비개발자도 편집 가능한 걸 얻습니다.
  ```ts
  // fixtures/user.mock.ts
  export const userFixture = { id: "1", name: "김철수" };
  ```
- **테스트에서 임시 오버라이드**:
  ```ts
  afterEach(() => McMockManager.resetOverrides());

  it.each([404, 500, 401])("status %i면 에러로 reject된다", async (status) => {
    McMockManager.override("GET", "/users/{id}", { error: "mock error" }, { status });
    await expect(userApi.getUser("1")).rejects.toMatchObject({ response: { status } });
  });
  ```

## 자주 하는 실수

- `@McEntity.ENTITY`를 빼먹음 — `McSerializable` 상속만으로는 필드가 안 채워집니다.
- `header()`를 구현하지 않음 — `McAxiosCore`의 필수 추상 메서드입니다. 헤더가 필요 없어도 `return undefined;`는 있어야 합니다.
- `@McAxios.GET`의 2번째 인자(응답 엔티티 타입)를 빠뜨림 — 생략 불가능한 필수 인자입니다.
- POST 등의 body에 평범한 객체를 그대로 넘김 — `McRequest` 서브클래스여야 합니다.
- `:id`로 씀 — `{id}`가 맞습니다.
- 파라미터에 데코레이터를 붙이려 함 — TC39엔 파라미터 데코레이터가 없습니다. 이름이 같으면 자동 매칭됩니다.
- `@McMock.GET`만 쓰고 `@McAxios.GET`을 빼먹음 — 실제 엔드포인트 등록이 안 되어 mock을 꺼도 화면이 동작하지 않습니다.
- 부트스트랩에서 동적 import를 안 씀 — 프로덕션에서 인터셉트가 계속 켜져 있을 수 있습니다.

## 데모 실행

`demo/`에 GET·POST·fixture 분리·에러 상태 시뮬레이터·테스트 패턴까지 5개 시나리오가 있는 실행 가능한 예제가 있습니다.

```bash
npm run demo
```

## Vite 설정

TC39 데코레이터를 쓰므로 `entityKitPlugin()`이 필요합니다(axios-kit·entity-kit과 동일한 이유 — Vite 6+ 기본 transformer가 데코레이터를 lowering하지 않습니다).

```ts
import { entityKitPlugin } from "@moca-labs/entity-kit-ts/vite";

export default defineConfig({ plugins: [entityKitPlugin(), vue()] });
```

## 알려진 제한

- **요청을 mock에 반영하지 못함**: 함수형 `mock`이 받는 인자는 path 파라미터뿐입니다. request body·header를 읽어 응답을 바꾸는 기능은 없습니다.
- **엔티티 필드로 mock 자동 생성 불가**: `entity-kit`이 필드 메타데이터를 공개 API로 노출하지 않아, mock 값을 손으로 채워야 합니다. `Partial<Awaited<ReturnType<T>>>` 같은 제네릭으로 타입 안전성만 확보할 수 있습니다.
- **Node 미지원**: 브라우저·모바일 웹뷰 대상입니다. `XMLHttpRequest`/`fetch`/`Response` 전역 인터셉트 방식이라 Node 환경에서는 동작하지 않습니다(테스트 시 `jsdom` 등 DOM 환경이 필요합니다).

## 라이선스

Apache-2.0
