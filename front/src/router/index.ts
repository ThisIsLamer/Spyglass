import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/pages/login.vue'),
      meta: { public: true },
    },
    {
      path: '/',
      component: () => import('@/layouts/default.vue'),
      children: [
        {
          path: '',
          name: 'dashboard',
          component: () => import('@/pages/dashboard.vue'),
        },
        {
          path: 'watchers',
          name: 'watchers',
          component: () => import('@/pages/watchers.vue'),
        },
        {
          path: 'events',
          name: 'events',
          component: () => import('@/pages/events.vue'),
        },
        {
          path: 'events/:guid',
          name: 'event-detail',
          component: () => import('@/pages/event-detail.vue'),
        },
        {
          path: 'providers',
          name: 'providers',
          component: () => import('@/pages/providers.vue'),
        },
        {
          path: 'users',
          name: 'users',
          component: () => import('@/pages/users.vue'),
          meta: { roles: ['admin'] },
        },
        {
          path: 'settings',
          name: 'settings',
          component: () => import('@/pages/settings.vue'),
        },
      ],
    },
  ],
})

router.beforeEach(to => {
  const auth = useAuthStore()

  if (to.meta.public) {
    return true
  }

  if (!auth.isAuthenticated) {
    return { name: 'login' }
  }

  if (to.meta.roles && Array.isArray(to.meta.roles)) {
    const userRole = auth.user?.role
    if (!userRole || !to.meta.roles.includes(userRole)) {
      return { name: 'dashboard' }
    }
  }

  return true
})

export default router
