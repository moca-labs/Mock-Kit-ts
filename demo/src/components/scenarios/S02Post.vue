<script setup lang="ts">
import { McAxiosManager } from "@moca-labs/axios-kit-ts";
import { ref } from "vue";
import { CreateUserRequest, UserApi } from "../../api/UserApi";

const userApi = McAxiosManager.createMcAxios(new UserApi());
const name = ref("홍길동");
const loading = ref(false);
const result = ref("");
const status = ref<"idle" | "success" | "error">("idle");

async function run() {
	loading.value = true;
	status.value = "idle";
	result.value = "";
	try {
		const user = await userApi.createUser(new CreateUserRequest(name.value));
		result.value = JSON.stringify(user, null, 2);
		status.value = "success";
	} catch (e) {
		result.value = (e as Error).message;
		status.value = "error";
	} finally {
		loading.value = false;
	}
}

const invalidLoading = ref(false);
const invalidResult = ref("");
const invalidStatus = ref<"idle" | "success" | "error">("idle");

async function runInvalid() {
	invalidLoading.value = true;
	invalidStatus.value = "idle";
	invalidResult.value = "";
	try {
		const user = await userApi.createInvalidUser(new CreateUserRequest(name.value));
		invalidResult.value = JSON.stringify(user, null, 2);
		invalidStatus.value = "success";
	} catch (e) {
		const err = e as { message: string; response?: { status: number; data: unknown } };
		invalidResult.value = JSON.stringify({ message: err.message, status: err.response?.status, data: err.response?.data }, null, 2);
		invalidStatus.value = "error";
	} finally {
		invalidLoading.value = false;
	}
}
</script>

<template>
	<div class="scenario-header">
		<div class="scenario-title">02 — POST</div>
		<div class="scenario-desc">
			GET 외 메서드도 동일한 패턴입니다. <strong>다만 mock-kit은 아직 요청 body를 mock 함수에
			반영하지 못합니다</strong> — 어떤 이름을 입력해도 같은 정적 응답(<code>id: "99"</code>)이 돌아오는 걸
			직접 확인해보십시오. 이건 버그가 아니라 현재 설계의 한계입니다(ISSUES.md M-3 참조).
		</div>
	</div>

	<div class="scenario-grid">
		<div class="panel">
			<div class="panel-header"><span class="dot"></span> 데코레이터 정의</div>
			<div class="panel-body">
				<div class="code-block">
					<pre>class CreateUserRequest extends McAxios.Request {
  @McEntity.SERIALIZE name!: string;
  constructor(name: string) {
    super();
    this.name = name;
  }
}

@McAxios.POST("/users", UserEntity)
@McAxios.REQUEST("body", 0)
@McMock.POST("/users", { id: "99", name: "새 사용자" }, { status: 201 })
createUser!: (body: CreateUserRequest) =&gt; Promise&lt;UserEntity&gt;;</pre>
				</div>
			</div>
		</div>

		<div class="panel">
			<div class="panel-header"><span class="dot"></span> 실행</div>
			<div class="panel-body">
				<div class="form-group">
					<label>name (입력해도 응답엔 반영되지 않습니다)</label>
					<input v-model="name" type="text" placeholder="홍길동" />
				</div>
				<button class="btn" :disabled="loading" @click="run">
					<span v-if="loading" class="spinner"></span>
					<span v-else>▶</span>
					{{ loading ? '요청 중...' : 'createUser() 실행' }}
				</button>
				<div v-if="result" style="margin-top: 16px;">
					<span :class="['status-badge', status]">{{ status === 'success' ? '✓ 201 Created' : '✕ Error' }}</span>
					<div :class="['result-box', status]">{{ result }}</div>
				</div>
			</div>
		</div>
	</div>

	<div class="scenario-header" style="margin-top: 32px;">
		<div class="scenario-title" style="font-size: 15px;">02b — 데코레이터에 고정된 에러</div>
		<div class="scenario-desc">
			<code>McMockManager.override</code>(S04)는 실행 중에 상태를 바꾸지만, 이 방법은 <code>@McMock.POST</code>
			옵션의 <code>status</code> 값을 코드에 그대로 박아둡니다 — 코드만 봐도 "이 엔드포인트는 항상 이 상태를
			반환한다"는 걸 알 수 있어 화면 개발 중 에러 UI를 계속 재현해야 할 때 편합니다. 대신 상태를 바꾸려면
			코드를 고쳐야 하므로, 여러 상태를 오가며 테스트하려면 S04의 override 방식이 더 맞습니다.
			같은 <code>method+path</code>에 mock을 두 개 등록할 수 없어(나중 등록이 이전 걸 덮어씀) 위 예시와는
			다른 경로(<code>/users/invalid</code>)를 씁니다.
		</div>
	</div>

	<div class="scenario-grid">
		<div class="panel">
			<div class="panel-header"><span class="dot"></span> 데코레이터 정의</div>
			<div class="panel-body">
				<div class="code-block">
					<pre>@McAxios.POST("/users/invalid", UserEntity)
@McAxios.REQUEST("body", 0)
@McMock.POST("/users/invalid", { error: "invalid payload" }, { status: 404 })
createInvalidUser!: (body: CreateUserRequest) =&gt; Promise&lt;UserEntity&gt;;</pre>
				</div>
			</div>
		</div>

		<div class="panel">
			<div class="panel-header"><span class="dot"></span> 실행</div>
			<div class="panel-body">
				<p style="color: var(--text-muted); font-size: 13px; margin-bottom: 16px;">
					위 name 입력값을 그대로 재사용합니다. 무엇을 보내든 항상 404가 돌아옵니다.
				</p>
				<button class="btn" :disabled="invalidLoading" @click="runInvalid">
					<span v-if="invalidLoading" class="spinner"></span>
					<span v-else>▶</span>
					{{ invalidLoading ? '요청 중...' : 'createInvalidUser() 실행' }}
				</button>
				<div v-if="invalidResult" style="margin-top: 16px;">
					<span :class="['status-badge', invalidStatus]">{{ invalidStatus === 'success' ? '✓ 성공(의도치 않음)' : '✕ 404 (고정)' }}</span>
					<div :class="['result-box', invalidStatus]">{{ invalidResult }}</div>
				</div>
			</div>
		</div>
	</div>
</template>
