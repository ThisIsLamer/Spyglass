<template>
  <div class="page-users">
    <header class="page-header">
      <h1 class="page-title">{{ t('users.title') }}</h1>

      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        size="small"
        @click="showCreate = true"
      >
        {{ t('users.create') }}
      </v-btn>
    </header>

    <!-- Users List -->
    <div class="users-list">
      <div
        v-for="user in mockUsers"
        :key="user.id"
        class="user-card"
      >
        <div class="user-card__header">
          <div class="user-card__avatar">
            <v-icon icon="mdi-account" size="20" />
          </div>

          <div class="user-card__info">
            <div class="user-card__name">{{ user.displayName || user.username }}</div>
            <div class="user-card__username">@{{ user.username }}</div>
          </div>

          <div class="user-card__badges">
            <v-chip
              :color="getRoleColor(user.role)"
              size="x-small"
              variant="flat"
            >
              {{ t(`users.${user.role}`) }}
            </v-chip>

            <div
              class="user-card__status"
              :class="{ 'user-card__status--active': user.isActive }"
            />
          </div>
        </div>

        <div class="user-card__meta">
          <span v-if="user.lastLogin">
            {{ t('users.lastLogin') }}: {{ user.lastLogin }}
          </span>
        </div>

        <div class="user-card__actions">
          <v-btn icon="mdi-pencil-outline" size="x-small" variant="text" />
        </div>
      </div>
    </div>

    <!-- Create Dialog (placeholder) -->
    <v-dialog v-model="showCreate" max-width="500">
      <v-card class="glass-card">
        <v-card-title>{{ t('users.create') }}</v-card-title>

        <v-card-text>
          <p style="color: rgba(230,237,243,0.6)">Форма создания будет здесь</p>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showCreate = false">{{ t('common.cancel') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts" setup>
  import { ref } from 'vue'
  import { useI18n } from 'vue-i18n'

  const { t } = useI18n()

  const showCreate = ref(false)

  function getRoleColor (role: string) {
    const map: Record<string, string> = {
      admin: 'error',
      operator: 'warning',
      viewer: 'info',
    }
    return map[role] ?? 'info'
  }

  // Mock data
  const mockUsers = ref([
    {
      id: '1',
      username: 'admin',
      displayName: 'Администратор',
      role: 'admin',
      isActive: true,
      lastLogin: '5 мин назад',
    },
    {
      id: '2',
      username: 'operator1',
      displayName: 'Оператор Иванов',
      role: 'operator',
      isActive: true,
      lastLogin: '2 часа назад',
    },
    {
      id: '3',
      username: 'viewer1',
      displayName: null,
      role: 'viewer',
      isActive: false,
      lastLogin: null,
    },
  ])
</script>

<style lang="scss" scoped>
.page-users {
  max-width: 800px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: rgb(var(--v-theme-on-surface));
}

.users-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.user-card {
  padding: 16px;
  background: rgba(22, 27, 34, 0.6);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(48, 54, 61, 0.5);
  border-radius: 14px;
  transition: border-color 0.15s ease;

  &:hover {
    border-color: rgba(0, 229, 255, 0.2);
  }
}

.user-card__header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.user-card__avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(0, 229, 255, 0.1);
  border: 1px solid rgba(0, 229, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgb(var(--v-theme-primary));
  flex-shrink: 0;
}

.user-card__info {
  flex: 1;
  min-width: 0;
}

.user-card__name {
  font-size: 14px;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
}

.user-card__username {
  font-size: 12px;
  color: rgba(230, 237, 243, 0.5);
  font-family: 'Roboto Mono', monospace;
}

.user-card__badges {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-card__status {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(230, 237, 243, 0.3);

  &--active {
    background: rgb(var(--v-theme-success));
    box-shadow: 0 0 6px rgba(63, 185, 80, 0.5);
  }
}

.user-card__meta {
  font-size: 12px;
  color: rgba(230, 237, 243, 0.5);
  margin-bottom: 8px;
  padding-left: 48px;
}

.user-card__actions {
  display: flex;
  gap: 4px;
  justify-content: flex-end;
}

.glass-card {
  background: rgba(22, 27, 34, 0.9) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(48, 54, 61, 0.6);
}
</style>
