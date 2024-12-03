import { createWebHistory, createRouter } from "vue-router";

import HomeView from "./components/HomeView.vue";
import v2HomeView from "./components/v2Home.vue";

const routes = [
  { path: "/", component: HomeView },
  { path: "/v2", component: v2HomeView },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
