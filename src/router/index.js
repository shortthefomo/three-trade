import { createRouter, createWebHistory } from 'vue-router'

import Dashboard from '../views/Dashboard.vue'

export const routes = [
    {
        path: '/',
        name: 'Trade',
        component: Dashboard,
        meta: { layout: 'MainLayout' }
    }
]

const history = createWebHistory()

const router = createRouter({
    history,
    routes,
})

export default router