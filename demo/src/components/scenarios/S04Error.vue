<script setup lang="ts">
import { McAxiosManager } from "@moca-labs/axios-kit-ts";
import { ref } from "vue";
import { UserApi } from "../../api/UserApi";

const userApi = McAxiosManager.createMcAxios(new UserApi());
const statusOptions = [400, 401, 403, 404, 500, 503];
const selectedStatus = ref(statusOptions[3]);
const loading = ref(false);
const result = ref("");
const status = ref<"idle" | "success" | "error">("idle");

async function trigger() {
	const { McMockManager } = await import("@moca-labs/mock-kit-ts");
	loading.value = true;
	status.value = "idle";
	result.value = "";
	McMockManager.override("GET", "/users/{id}", { error: `mock ${selectedStatus.value} error` }, { status: selectedStatus.value });
	try {
		const user = await userApi.getUser("1");
		status.value = "success";
		result.value = JSON.stringify(user, null, 2);
	} catch (e) {
		status.value = "error";
		const err = e as { message: string; response?: { status: number; data: unknown } };
		result.value = JSON.stringify({ message: err.message, status: err.response?.status, data: err.response?.data }, null, 2);
	} finally {
		loading.value = false;
		McMockManager.resetOverrides();
	}
}
</script>

<template>
	<div class="scenario-header">
		<div class="scenario-title">04 — 예외 발생기</div>
		<div class="scenario-desc">
			<code>McMockManager.override</code>로 특정 요청 한 건만 임시로 다른 status를 돌려주게 만들 수 있습니다.
			axios의 <code>AxiosError</code>가 실제로 어떤 모양인지 여기서 확인하십시오.
		</div>
	</div>

	<div class="scenario-grid">
		<div class="panel">
			<div class="panel-header"><span class="dot"></span> 코드</div>
			<div class="panel-body">
				<div class="code-block">
					<pre>McMockManager.override(
  "GET", "/users/{id}",
  { error: "mock error" },
  { status: 404 },
);

try {
  await userApi.getUser("1");
} catch (e) {
  // e.response.status === 404
  // e.response.data    === { error: "mock error" }
} finally {
  McMockManager.resetOverrides();
}</pre>
				</div>
			</div>
		</div>

		<div class="panel">
			<div class="panel-header"><span class="dot"></span> 실행</div>
			<div class="panel-body">
				<div class="form-group">
					<label>시뮬레이션할 status</label>
					<select v-model.number="selectedStatus">
						<option v-for="s in statusOptions" :key="s" :value="s">{{ s }}</option>
					</select>
				</div>
				<button class="btn" :disabled="loading" @click="trigger">
					<span v-if="loading" class="spinner"></span>
					<span v-else>▶</span>
					{{ loading ? '요청 중...' : `status ${selectedStatus} 시뮬레이션` }}
				</button>
				<div v-if="result" style="margin-top: 16px;">
					<span :class="['status-badge', status]">{{ status === 'success' ? '✓ 성공(의도치 않음)' : '✕ AxiosError' }}</span>
					<div :class="['result-box', status]">{{ result }}</div>
				</div>
			</div>
		</div>
	</div>
</template>
