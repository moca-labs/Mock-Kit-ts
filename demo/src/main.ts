import { createApp } from "vue";
import App from "./App.vue";
import { bootstrapMock } from "./bootstrap";
import "./style.css";

bootstrapMock().then(() => {
	createApp(App).mount("#app");
});
