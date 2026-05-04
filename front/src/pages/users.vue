<template>
  <div class="page-users">
    <header class="page-header">
      <h1 class="page-title">{{ t('users.title') }}</h1>

      <v-btn
        v-if="auth.isAdmin"
        color="primary"
        prepend-icon="mdi-plus"
        size="small"
        @click="openCreate"
      >
        {{ t('users.create') }}
      </v-btn>
    </header>

    <div v-if="loading" class="loading-state">
      <v-progress-circular color="primary" indeterminate />
    </div>

    <div v-else class="users-list">
      <div v-for="user in users" :key="user.guid" class="user-card">
        <div class="user-card__header">
          <div class="user-card__avatar">
            <v-icon icon="mdi-account" size="20" />
          </div>

          <div class="user-card__info">
            <div class="user-card__name">{{ user.displayName }}</div>
            <div class="user-card__username">@{{ user.username }}</div>
          </div>

          <div class="user-card__badges">
            <v-chip :color="getRoleColor(user.role)" size="x-small" variant="flat">
              {{ t(`users.${user.role}`) }}
            </v-chip>
          </div>
        </div>

        <div class="user-card__meta">
          <span v-if="user.lastLoginAt">
            {{ t('users.lastLogin') }}: {{ formatDate(user.lastLoginAt) }}
          </span>

          <span v-if="user.language" class="user-card__lang">{{ user.language }}</span>
        </div>

        <div v-if="auth.isAdmin" class="user-card__actions">
          <v-btn icon="mdi-pencil-outline" size="x-small" variant="text" @click="openEdit(user)" />
        </div>
      </div>

      <div v-if="users.length === 0" class="empty-state">
        <v-icon color="primary" icon="mdi-account-group-outline" size="48" />
        <p>{{ t('common.noData') }}</p>
      </div>
    </div>
    <!-- Create / Edit Dialog -->
    <v-dialog v-model="showDialog" max-width="460">
      <v-card class="glass-card">
        <v-card-title>{{ editingUser ? t('users.edit') : t('users.create') }}</v-card-title>

        <v-card-text>
          <form autocomplete="off" class="form-fields" @submit.prevent="handleSave">
            <v-text-field
              v-if="!editingUser"
              v-model="form.username"
              :error-messages="formError"
              :label="t('users.username')"
            />

            <v-text-field
              v-model="form.password"
              :label="t('users.password')"
              type="password"
            />

            <v-text-field
              v-model="form.displayName"
              :label="t('users.displayName')"
            />

            <v-select
              v-model="form.role"
              :items="roleItems"
              :label="t('users.role')"
            />

            <v-switch
              v-if="editingUser"
              v-model="form.isActive"
              color="primary"
              hide-details
              :label="t('users.active')"
            />
          </form>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showDialog = false">{{ t('common.cancel') }}</v-btn>

          <v-btn color="primary" :loading="saving" variant="flat" @click="handleSave">
            {{ t('common.save') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts" setup>
  import { onMounted, ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { type User, usersApi } from '@/api/users'
  import { useAuthStore } from '@/stores/auth'

  const { t } = useI18n()
  const auth = useAuthStore()

  const users = ref<User[]>([])
  const loading = ref(true)
  const showDialog = ref(false)
  const saving = ref(false)
  const formError = ref('')
  const editingUser = ref<User | null>(null)

  const form = ref({
    username: '',
    password: '',
    displayName: '',
    role: 'viewer' as 'admin' | 'operator' | 'viewer',
    isActive: true,
  })

  const roleItems = [
    { title: t('users.admin'), value: 'admin' },
    { title: t('users.operator'), value: 'operator' },
    { title: t('users.viewer'), value: 'viewer' },
  ]

  function getRoleColor (role: string) {
    return { admin: 'error', operator: 'warning', viewer: 'info' }[role] ?? 'info'
  }

  function formatDate (dateStr: string) {
    return new Date(dateStr).toLocaleString()
  }

  function openCreate () {
    editingUser.value = null
    form.value = { username: '', password: '', displayName: '', role: 'viewer', isActive: true }
    formError.value = ''
    showDialog.value = true
  }

  function openEdit (user: User) {
    editingUser.value = user
    form.value = {
      username: user.username,
      password: '',
      displayName: user.displayName,
      role: user.role,
      isActive: true,
    }
    formError.value = ''
    showDialog.value = true
  }

  async function loadUsers () {
    loading.value = true
    const res = await usersApi.getAll()
    if (res.success) users.value = res.data
    loading.value = false
  }

  async function handleSave () {
    formError.value = ''
    saving.value = true

    if (editingUser.value) {
      const dto: Record<string, unknown> = {}
      if (form.value.displayName) dto.displayName = form.value.displayName
      if (form.value.role) dto.role = form.value.role
      if (form.value.password) dto.password = form.value.password
      dto.isActive = form.value.isActive

      const res = await usersApi.update(editingUser.value.guid, dto)
      if (res.success) {
        showDialog.value = false
        await loadUsers()
      } else {
        formError.value = res.message || 'Error'
      }
    } else {
      if (!form.value.username || !form.value.password) {
        formError.value = 'Username and password required'
        saving.value = false
        return
      }
      const res = await usersApi.create({
        username: form.value.username,
        password: form.value.password,
        ...(form.value.displayName && { displayName: form.value.displayName }),
        ...(form.value.role && { role: form.value.role }),
      })
      if (res.success) {
        showDialog.value = false
        await loadUsers()
      } else {
        formError.value = ('error' in res ? (res as any).error : res.message) || 'Error'
      }
    }

    saving.value = false
  }

  onMounted(loadUsers)
</script>

<style lang="scss" scoped>
.page-users { max-width: 800px; margin: 0 auto; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.page-title { font-size: 24px; font-weight: 700; color: rgb(var(--v-theme-on-surface)); }
.loading-state { display: flex; justify-content: center; padding: 48px; }
.users-list { display: flex; flex-direction: column; gap: 12px; }
.user-card {
  padding: 16px;
  background: rgba(22, 27, 34, 0.6);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(48, 54, 61, 0.5);
  border-radius: 14px;
  transition: border-color 0.15s ease;
  &:hover { border-color: rgba(0, 229, 255, 0.2); }
}
.user-card__header { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
.user-card__avatar {
  width: 36px; height: 36px; border-radius: 50%;
  background: rgba(0, 229, 255, 0.1); border: 1px solid rgba(0, 229, 255, 0.2);
  display: flex; align-items: center; justify-content: center;
  color: rgb(var(--v-theme-primary)); flex-shrink: 0;
}
.user-card__info { flex: 1; min-width: 0; }
.user-card__name { font-size: 14px; font-weight: 600; color: rgb(var(--v-theme-on-surface)); }
.user-card__username { font-size: 12px; color: rgba(230, 237, 243, 0.5); font-family: 'Roboto Mono', monospace; }
.user-card__badges { display: flex; align-items: center; gap: 8px; }
.user-card__meta {
  display: flex; align-items: center; gap: 12px;
  font-size: 12px; color: rgba(230, 237, 243, 0.5);
  margin-bottom: 8px; padding-left: 48px;
}
.user-card__lang {
  padding: 1px 6px; background: rgba(0, 229, 255, 0.08);
  border-radius: 4px; font-family: 'Roboto Mono', monospace;
  color: rgb(var(--v-theme-primary));
}
.user-card__actions { display: flex; gap: 4px; justify-content: flex-end; }
.empty-state {
  display: flex; flex-direction: column; align-items: center;
  gap: 12px; padding: 48px 16px; color: rgba(230, 237, 243, 0.5);
}
.glass-card {
  background: rgba(22, 27, 34, 0.95) !important;
  backdrop-filter: blur(20px); border: 1px solid rgba(48, 54, 61, 0.6);
}
.form-fields { display: flex; flex-direction: column; gap: 4px; }
</style>
