<script setup lang="ts">
import { McAxiosManager } from "@moca-labs/axios-kit-ts";
import { ref } from "vue";
import { UserApi } from "../../api/UserApi";

const userApi = McAxiosManager.createMcAxios(new UserApi());
const userId = ref("1");
const loading = ref(false);
const result = ref("");
const status = ref<"idle" | "success" | "error">("idle");

async function run() {
	loading.value = true;
	status.value = "idle";
	result.value = "";
	try {
		const user = await userApi.getUser(userId.value);
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
		<div class="scenario-title">01 — GET</div>
		<div class="scenario-desc">
			<code>@McAxios.GET</code>이 실제 엔드포인트를, <code>@McMock.GET</code>이 그 위에 정적 mock 응답을 얹습니다.
			mock이 켜져 있으면 실제 네트워크 없이 이 값이 그대로 돌아옵니다.
		</div>
	</div>

	<div class="scenario-grid">
		<div class="panel">
			<div class="panel-header"><span class="dot"></span> 데코레이터 정의</div>
			<div class="panel-body">
				<div class="code-block">
					<pre>@McAxios.GET("/users/{id}", UserEntity)
@McMock.GET("/users/{id}", { id: "1", name: "김철수" })
getUser!: (id: string) =&gt; Promise&lt;UserEntity&gt;;</pre>
				</div>
			</div>
		</div>

		<div class="panel">
			<div class="panel-header"><span class="dot"></span> 실행</div>
			<div class="panel-body">
				<div class="form-group">
					<label>User ID</label>
					<input v-model="userId" type="text" placeholder="1" />
				</div>
				<button class="btn" :disabled="loading" @click="run">
					<span v-if="loading" class="spinner"></span>
					<span v-else>▶</span>
					{{ loading ? '요청 중...' : 'getUser() 실행' }}
				</button>
				<div v-if="result" style="margin-top: 16px;">
					<span :class="['status-badge', status]">{{ status === 'success' ? '✓ UserEntity' : '✕ Error' }}</span>
					<div :class="['result-box', status]">{{ result }}</div>
				</div>
			</div>
		</div>
	</div>
</template>
