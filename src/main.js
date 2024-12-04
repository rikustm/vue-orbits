import { createApp } from "vue";
import VueKatex from "@hsorby/vue3-katex";
import "katex/dist/katex.min.css";

import router from "./router";
import App from "./App.vue";

const app = createApp(App);
app.use(router);
app.use(VueKatex);

app.mount("#app");
