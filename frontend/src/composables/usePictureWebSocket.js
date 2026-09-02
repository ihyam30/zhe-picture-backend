import { computed, onBeforeUnmount, ref, unref, watch } from 'vue';
import { WS_BASE_URL } from '@/constants/app';
import { useAuthStore } from '@/store/auth';
const HEARTBEAT_INTERVAL_MS = 5000;
function getPayloadUser(payload) {
    return 'user' in payload ? payload.user : undefined;
}
function getActionText(action) {
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
function getMessageText(payload) {
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
export function usePictureWebSocket(pictureId) {
    const authStore = useAuthStore();
    const socket = ref(null);
    const isConnected = ref(false);
    const onlineUsers = ref([]);
    const editingUser = ref(null);
    const messages = ref([]);
    const latestEditAction = ref(null);
    let heartbeatTimer = null;
    let reconnectTimer = null;
    let reconnectAttempt = 0;
    let manuallyClosed = false;
    const currentPictureId = computed(() => unref(pictureId));
    const wsUrl = computed(() => {
        if (!currentPictureId.value) {
            return '';
        }
        return `${WS_BASE_URL}/ws/picture/edit?pictureId=${encodeURIComponent(String(currentPictureId.value))}`;
    });
    const isEditing = computed(() => String(editingUser.value?.id || '') === String(authStore.user?.id || ''));
    function pushMessage(payload) {
        messages.value.unshift({
            id: Date.now() + Math.random(),
            type: payload.type,
            text: getMessageText(payload),
            userName: getPayloadUser(payload)?.userName,
            createdAt: new Date(),
        });
        messages.value = messages.value.slice(0, 40);
    }
    function upsertOnlineUser(user) {
        if (!user?.id) {
            return;
        }
        const existingIndex = onlineUsers.value.findIndex((item) => String(item.id) === String(user.id));
        if (existingIndex >= 0) {
            onlineUsers.value.splice(existingIndex, 1, { ...onlineUsers.value[existingIndex], ...user });
            return;
        }
        onlineUsers.value.unshift(user);
    }
    function removeOnlineUser(user) {
        if (!user?.id) {
            return;
        }
        onlineUsers.value = onlineUsers.value.filter((item) => String(item.id) !== String(user.id));
    }
    function handleIncomingMessage(event) {
        let payload;
        try {
            payload = JSON.parse(event.data);
        }
        catch {
            pushMessage({ type: 'ERROR', message: '收到无法解析的协同消息' });
            return;
        }
        if (payload.type === 'PONG') {
            return;
        }
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
    function send(message) {
        if (!socket.value || socket.value.readyState !== WebSocket.OPEN) {
            return;
        }
        socket.value.send(JSON.stringify(message));
    }
    function clearHeartbeat() {
        if (heartbeatTimer !== null) {
            window.clearInterval(heartbeatTimer);
            heartbeatTimer = null;
        }
    }
    function clearReconnect() {
        if (reconnectTimer !== null) {
            window.clearTimeout(reconnectTimer);
            reconnectTimer = null;
        }
    }
    function scheduleReconnect() {
        if (manuallyClosed || reconnectTimer !== null || !currentPictureId.value) {
            return;
        }
        const delay = Math.min(30000, 1000 * 2 ** Math.min(reconnectAttempt, 5));
        reconnectAttempt += 1;
        reconnectTimer = window.setTimeout(() => {
            reconnectTimer = null;
            void connect();
        }, delay);
    }
    async function connect() {
        manuallyClosed = false;
        clearReconnect();
        if (!authStore.isLogin) {
            await authStore.fetchCurrentUser({ silent: true });
        }
        if (manuallyClosed || !authStore.isLogin || !wsUrl.value) {
            return;
        }
        if (socket.value &&
            (socket.value.readyState === WebSocket.OPEN || socket.value.readyState === WebSocket.CONNECTING)) {
            return;
        }
        const currentSocket = new WebSocket(wsUrl.value);
        socket.value = currentSocket;
        currentSocket.onopen = () => {
            if (socket.value !== currentSocket) {
                return;
            }
            reconnectAttempt = 0;
            isConnected.value = true;
            clearHeartbeat();
            heartbeatTimer = window.setInterval(() => send({ type: 'HEARTBEAT' }), HEARTBEAT_INTERVAL_MS);
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
        currentSocket.onmessage = handleIncomingMessage;
        currentSocket.onerror = () => {
            pushMessage({ type: 'ERROR', message: '协同编辑连接出现异常' });
        };
        currentSocket.onclose = () => {
            if (socket.value !== currentSocket) {
                return;
            }
            clearHeartbeat();
            socket.value = null;
            isConnected.value = false;
            editingUser.value = null;
            onlineUsers.value = authStore.user
                ? onlineUsers.value.filter((item) => String(item.id) === String(authStore.user?.id || ''))
                : [];
            pushMessage({ type: 'INFO', message: '协同编辑连接已关闭' });
            scheduleReconnect();
        };
    }
    function disconnect() {
        manuallyClosed = true;
        clearReconnect();
        clearHeartbeat();
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
    function sendAction(editAction) {
        send({ type: 'EDIT_ACTION', editAction });
    }
    watch(currentPictureId, (newValue, oldValue) => {
        if (oldValue && newValue !== oldValue) {
            disconnect();
        }
    });
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
