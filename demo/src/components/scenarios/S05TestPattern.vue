<script setup lang="ts">
import { McAxiosManager } from "@moca-labs/axios-kit-ts";
import { ref } from "vue";
import { UserApi } from "../../api/UserApi";

const userApi = McAxiosManager.createMcAxios(new UserApi());
const logs = ref<Array<{ ok: boolean; text: string }>>([]);
const loading = ref(false);

async function runAll() {
	const { McMockManager } = await import("@moca-labs/mock-kit-ts");
	loading.value = true;
	logs.value = [];
	for (const s of [200, 404, 500, 401]) {
		if (s !== 200) {
			McMockManager.override("GET", "/users/{id}", { error: "mock error" }, { status: s });
		}
		try {
			await userApi.getUser("1");
			logs.value.push({ ok: true, text: `status ${s} → 성공` });
		} catch (e) {
			logs.value.push({ ok: false, text: `status ${s} → ${(e as Error).message}` });
		}
		McMockManager.resetOverrides();
	}
	loading.value = false;
}
</script>

<template>
	<div class="scenario-header">
		<div class="scenario-title">05 — 테스트 패턴</div>
		<div class="scenario-desc">
			이 화면은 <code>McMockManager.override</code>를 반복 호출해 여러 status를 순서대로 재현합니다.
			실제 자동화 테스트에서는 이와 동일한 걸 Vitest로 검증합니다 — 아래 코드가
			<code>src/McMock.integration.spec.ts</code>에 실제로 있는 테스트입니다.
		</div>
	</div>

	<div class="scenario-grid">
		<div class="panel">
			<div class="panel-header"><span class="dot"></span> Vitest 샘플</div>
			<div class="panel-body">
				<div class="code-block">
					<pre>afterEach(() => {
  McMockManager.resetOverrides();
});

it.each([404, 500, 401])(
  "status %i면 에러로 reject된다",
  async (status) => {
    McMockManager.override(
      "GET", "/users/{id}",
      { error: "mock error" },
      { status },
    );
    await expect(
      userApi.getUser("1")
    ).rejects.toMatchObject({
      response: { status },
    });
  },
);</pre>
				</div>
			</div>
		</div>

		<div class="panel">
			<div class="panel-header"><span class="dot"></span> 브라우저에서 같은 시나리오 실행</div>
			<div class="panel-body">
				<button class="btn" :disabled="loading" @click="runAll">
					<span v-if="loading" class="spinner"></span>
					<span v-else>▶</span>
					{{ loading ? '실행 중...' : '200 → 404 → 500 → 401 순서로 실행' }}
				</button>
				<ul class="log-list" style="margin-top: 16px;">
					<li v-for="(log, i) in logs" :key="i" :class="log.ok ? 'ok' : 'err'">{{ log.text }}</li>
				</ul>
			</div>
		</div>
	</div>
</template>
