<script setup lang="ts">
import { type Component, markRaw, ref } from "vue";
import S01Get from "./components/scenarios/S01Get.vue";
import S02Post from "./components/scenarios/S02Post.vue";
import S03Fixture from "./components/scenarios/S03Fixture.vue";
import S04Error from "./components/scenarios/S04Error.vue";
import S05TestPattern from "./components/scenarios/S05TestPattern.vue";

const tabs: Array<{ id: string; label: string; tag: string; component: Component }> = [
	{ id: "s01", label: "GET", tag: "01", component: markRaw(S01Get) },
	{ id: "s02", label: "POST", tag: "02", component: markRaw(S02Post) },
	{ id: "s03", label: "Fixture 파일", tag: "03", component: markRaw(S03Fixture) },
	{ id: "s04", label: "예외 발생기", tag: "04", component: markRaw(S04Error) },
	{ id: "s05", label: "테스트 패턴", tag: "05", component: markRaw(S05TestPattern) },
];

// biome-ignore lint/correctness/noUnusedVariables: used in Vue template
const active = ref(tabs[0]);
</script>

<template>
	<header class="app-header">
		<span class="logo"><span>@moca-labs</span>/mock-kit-ts</span>
		<span class="badge">Demo</span>
		<span class="sub">axios-kit 위에 얹는 mock 엔진</span>
	</header>

	<div class="app-body">
		<nav class="sidebar">
			<div class="sidebar-section">시나리오</div>
			<button
				v-for="tab in tabs"
				:key="tab.id"
				:class="['tab-btn', { active: active.id === tab.id }]"
				@click="active = tab"
			>
				{{ tab.label }}
				<span class="tag">{{ tab.tag }}</span>
			</button>
		</nav>

		<main class="main">
			<component :is="active.component" />
		</main>
	</div>
</template>
