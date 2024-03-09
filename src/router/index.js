import { createRouter, createWebHistory } from 'vue-router'

import Dashboard from '../views/Dashboard.vue'
import SwapDash from '../views/SwapDash.vue'

export const routes = [
    {
        path: '/',
        name: 'Trade',
        component: Dashboard,
        meta: { layout: 'MainLayout' }
    },
    {
        path: '/swap',
        name: 'Swap',
        component: SwapDash,
        meta: { layout: 'MainLayout' }
    },
]

const history = createWebHistory()

const router = createRouter({
    history,
    routes,
})

export default router