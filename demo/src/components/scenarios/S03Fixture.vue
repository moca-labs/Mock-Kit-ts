<script setup lang="ts">
import { McAxiosManager } from "@moca-labs/axios-kit-ts";
import { ref } from "vue";
import { UserApi } from "../../api/UserApi";

const userApi = McAxiosManager.createMcAxios(new UserApi());
const loading = ref(false);
const result = ref("");
const status = ref<"idle" | "success" | "error">("idle");

async function run() {
	loading.value = true;
	status.value = "idle";
	result.value = "";
	try {
		const user = await userApi.getUserProfile("1");
		result.value = JSON.stringify(user, null, 2);
		status.value = "success";
	} catch (e) {
		result.value = (e as Error).message;
		status.value = "error";
	} finally {
		loading.value = false;
	}
}
</script>

<template>
	<div class="scenario-header">
		<div class="scenario-title">03 — Fixture 파일</div>
		<div class="scenario-desc">
			mock 값을 데코레이터에 직접 쓰는 대신, 평범한 ES 모듈 import로 별도 파일에서 가져올 수 있습니다.
			mock-kit 쪽에 별도 "파일 로더" 기능은 없습니다 — 그냥 JS 값입니다.
		</div>
	</div>

	<div class="scenario-grid">
		<div class="panel">
			<div class="panel-header"><span class="dot"></span> fixtures/user.mock.ts</div>
			<div class="panel-body">
				<div class="code-block">
					<pre>export const userProfileFixture = {
  id: "1",
  name: "김철수",
  email: "chulsoo@example.com",
};

// UserApi.ts
import { userProfileFixture } from "../fixtures/user.mock";

@McAxios.GET("/users/{id}/profile", UserEntity)
@McMock.GET("/users/{id}/profile", userProfileFixture)
getUserProfile!: (id: string) =&gt; Promise&lt;UserEntity&gt;;</pre>
				</div>
			</div>
		</div>

		<div class="panel">
			<div class="panel-header"><span class="dot"></span> 실행</div>
			<div class="panel-body">
				<p style="color: var(--text-muted); font-size: 13px; margin-bottom: 16px;">
					인라인 예시(S01)에는 없던 <code>email</code> 필드가 fixture 파일에는 있습니다 — 분리된 파일임을
					눈으로 확인할 수 있게 일부러 다르게 채웠습니다.
				</p>
				<button class="btn" :disabled="loading" @click="run">
					<span v-if="loading" class="spinner"></span>
					<span v-else>▶</span>
					{{ loading ? '요청 중...' : 'getUserProfile() 실행' }}
				</button>
				<div v-if="result" style="margin-top: 16px;">
					<span :class="['status-badge', status]">{{ status === 'success' ? '✓ UserEntity' : '✕ Error' }}</span>
					<div :class="['result-box', status]">{{ result }}</div>
				</div>
			</div>
		</div>
	</div>
</template>
