import { computed, onBeforeUnmount, ref, unref, watch, type Ref } from 'vue';
import { WS_BASE_URL } from '@/constants/app';
import { useAuthStore } from '@/store/auth';
import type { Id } from '@/types/common';
import type {
  PictureEditRequestMessage,
  PictureEditResponseMessage,
} from '@/types/picture';
import type { UserVO } from '@/types/user';

interface MessageRecord {
  id: number;
  type: string;
  text: string;
  userName?: string;
  createdAt: Date;
}

interface LocalNoticeMessage {
  type: string;
  message: string;
}

function getPayloadUser(payload: PictureEditResponseMessage | LocalNoticeMessage) {
  return 'user' in payload ? payload.user : undefined;
}

function getActionText(action?: string) {
  switch (action) {
    case 'ROTATE_LEFT':
      return '向左旋转图片';
    case 'ROTATE_RIGHT':
      return '向右旋转图片';
    case 'ZOOM_IN':
      return '放大图片';
    case 'ZOOM_OUT':
      return '缩小图片';
    default:
      return '执行编辑操作';
  }
}

function getMessageText(payload: PictureEditResponseMessage | LocalNoticeMessage) {
  if (!('user' in payload)) {
    return payload.message || '';
  }

  const userName = payload.user?.userName || payload.user?.userAccount || '成员';

  switch (payload.type) {
    case 'ENTER_EDIT':
      return `${userName} 开始编辑图片`;
    case 'EXIT_EDIT':
      return `${userName} 结束编辑`;
    case 'EDIT_ACTION':
      return `${userName} ${getActionText(payload.editAction)}`;
    case 'INFO':
      return payload.message || `${userName} 已加入协同会话`;
    default:
      return payload.message || `${userName} 发送了一条协同消息`;
  }
}

export function usePictureWebSocket(pictureId: Ref<Id | undefined> | Id | undefined) {
  const authStore = useAuthStore();
  const socket = ref<WebSocket | null>(null);
  const isConnected = ref(false);
  const onlineUsers = ref<UserVO[]>([]);
  const editingUser = ref<UserVO | null>(null);
  const messages = ref<MessageRecord[]>([]);
  const latestEditAction = ref<{ action: string; userId?: string } | null>(null);

  const currentPictureId = computed(() => unref(pictureId));
  const wsUrl = computed(() => {
    if (!currentPictureId.value) {
      return '';
    }
    return `${WS_BASE_URL}/ws/picture/edit?pictureId=${encodeURIComponent(String(currentPictureId.value))}`;
  });

  const isEditing = computed(
    () => String(editingUser.value?.id || '') === String(authStore.user?.id || ''),
  );

  function pushMessage(payload: PictureEditResponseMessage | LocalNoticeMessage) {
    messages.value.unshift({
      id: Date.now() + Math.random(),
      type: payload.type,
      text: getMessageText(payload),
      userName: getPayloadUser(payload)?.userName,
      createdAt: new Date(),
    });
    messages.value = messages.value.slice(0, 40);
  }

  function upsertOnlineUser(user?: UserVO) {
    if (!user?.id) {
      return;
    }
    const existingIndex = onlineUsers.value.findIndex(
      (item) => String(item.id) === String(user.id),
    );
    if (existingIndex >= 0) {
      onlineUsers.value.splice(existingIndex, 1, { ...onlineUsers.value[existingIndex], ...user });
      return;
    }
    onlineUsers.value.unshift(user);
  }

  function removeOnlineUser(user?: UserVO) {
    if (!user?.id) {
      return;
    }
    onlineUsers.value = onlineUsers.value.filter(
      (item) => String(item.id) !== String(user.id),
    );
  }

  function handleIncomingMessage(event: MessageEvent) {
    const payload = JSON.parse(event.data) as PictureEditResponseMessage;

    if (payload.type === 'INFO') {
      if (payload.user) {
        upsertOnlineUser(payload.user);
      }
      if (payload.message?.includes('离开会话') || payload.message?.includes('断开连接')) {
        removeOnlineUser(payload.user);
      }
    }

    if (payload.type === 'ENTER_EDIT') {
      editingUser.value = payload.user || null;
      upsertOnlineUser(payload.user);
    }

    if (payload.type === 'EXIT_EDIT') {
      if (String(editingUser.value?.id || '') === String(payload.user?.id || '')) {
        editingUser.value = null;
      }
      if (payload.user) {
        upsertOnlineUser(payload.user);
      }
    }

    if (payload.type === 'EDIT_ACTION') {
      upsertOnlineUser(payload.user);
      latestEditAction.value = {
        action: payload.editAction || '',
        userId: payload.user?.id ? String(payload.user.id) : undefined,
      };
    }

    pushMessage(payload);
  }

  function send(message: PictureEditRequestMessage) {
    if (!socket.value || socket.value.readyState !== WebSocket.OPEN) {
      return;
    }
    socket.value.send(JSON.stringify(message));
  }

  async function connect() {
    if (!authStore.isLogin) {
      await authStore.fetchCurrentUser({ silent: true });
    }
    if (!authStore.isLogin || !wsUrl.value) {
      return;
    }
    if (
      socket.value &&
      (socket.value.readyState === WebSocket.OPEN || socket.value.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    socket.value = new WebSocket(wsUrl.value);
    socket.value.onopen = () => {
      isConnected.value = true;
      if (authStore.user) {
        upsertOnlineUser({
          id: authStore.user.id,
          userAccount: authStore.user.userAccount,
          userName: authStore.user.userName,
          userAvatar: authStore.user.userAvatar,
          userProfile: authStore.user.userProfile,
          userRole: authStore.user.userRole,
          createTime: authStore.user.createTime,
        });
      }
      pushMessage({ type: 'INFO', message: '已建立协同编辑连接' });
    };
    socket.value.onmessage = handleIncomingMessage;
    socket.value.onerror = () => {
      pushMessage({ type: 'ERROR', message: '协同编辑连接出现异常' });
    };
    socket.value.onclose = () => {
      isConnected.value = false;
      editingUser.value = null;
      onlineUsers.value = authStore.user
        ? onlineUsers.value.filter((item) => String(item.id) === String(authStore.user?.id || ''))
        : [];
      pushMessage({ type: 'INFO', message: '协同编辑连接已关闭' });
    };
  }

  function disconnect() {
    if (socket.value) {
      socket.value.close();
      socket.value = null;
    }
    isConnected.value = false;
    editingUser.value = null;
    onlineUsers.value = [];
  }

  function enterEdit() {
    send({ type: 'ENTER_EDIT' });
  }

  function exitEdit() {
    send({ type: 'EXIT_EDIT' });
  }

  function sendAction(editAction: string) {
    send({ type: 'EDIT_ACTION', editAction });
  }

  watch(
    currentPictureId,
    (newValue, oldValue) => {
      if (oldValue && newValue !== oldValue) {
        disconnect();
      }
    },
  );

  onBeforeUnmount(disconnect);

  return {
    isConnected,
    onlineUsers,
    editingUser,
    latestEditAction,
    isEditing,
    messages,
    connect,
    disconnect,
    enterEdit,
    exitEdit,
    sendAction,
  };
}
