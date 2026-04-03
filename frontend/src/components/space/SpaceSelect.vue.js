import { computed, onMounted, ref, watch } from 'vue';
import { listSpaceVOByPage } from '@/api/space';
import { listMyTeamSpaces } from '@/api/spaceUser';
import { DEFAULT_PAGE_SIZE } from '@/constants/app';
import { useAuthStore } from '@/store/auth';
import { uniqueById } from '@/utils/format';
const props = withDefaults(defineProps(), {
    modelValue: '',
    includePublic: false,
    teamOnly: false,
    clearable: true,
    placeholder: '请选择空间',
});
const emit = defineEmits();
const authStore = useAuthStore();
const loading = ref(false);
const options = ref([]);
const innerValue = ref(props.modelValue);
const selectOptions = computed(() => {
    const merged = props.teamOnly
        ? options.value.filter((item) => item.spaceType === 1)
        : options.value;
    return merged;
});
watch(() => props.modelValue, (value) => {
    innerValue.value = value;
});
watch(innerValue, (value) => {
    emit('update:modelValue', value);
    emit('change', value);
});
async function loadSpaces() {
    if (!authStore.user?.id) {
        return;
    }
    loading.value = true;
    try {
        const [ownedResult, joinedResult] = await Promise.allSettled([
            listSpaceVOByPage({
                current: 1,
                pageSize: Math.max(DEFAULT_PAGE_SIZE * 2, 20),
                userId: authStore.user.id,
                sortField: 'updateTime',
                sortOrder: 'descend',
            }),
            listMyTeamSpaces(),
        ]);
        const ownedSpaces = ownedResult.status === 'fulfilled' ? ownedResult.value.records : [];
        const joinedSpaces = joinedResult.status === 'fulfilled'
            ? joinedResult.value
                .map((item) => item.space)
                .filter((item) => Boolean(item))
            : [];
        options.value = uniqueById([...ownedSpaces, ...joinedSpaces]);
        emit('loaded', options.value);
    }
    finally {
        loading.value = false;
    }
}
onMounted(loadSpaces);
const __VLS_exposed = {
    refresh: loadSpaces,
};
defineExpose(__VLS_exposed);
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_withDefaultsArg = (function (t) { return t; })({
    modelValue: '',
    includePublic: false,
    teamOnly: false,
    clearable: true,
    placeholder: '请选择空间',
});
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
const __VLS_0 = {}.ElSelect;
/** @type {[typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    modelValue: (__VLS_ctx.innerValue),
    loading: (__VLS_ctx.loading),
    placeholder: (__VLS_ctx.placeholder),
    clearable: (__VLS_ctx.clearable),
    ...{ style: {} },
}));
const __VLS_2 = __VLS_1({
    modelValue: (__VLS_ctx.innerValue),
    loading: (__VLS_ctx.loading),
    placeholder: (__VLS_ctx.placeholder),
    clearable: (__VLS_ctx.clearable),
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
var __VLS_4 = {};
__VLS_3.slots.default;
if (__VLS_ctx.includePublic) {
    const __VLS_5 = {}.ElOption;
    /** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
    // @ts-ignore
    const __VLS_6 = __VLS_asFunctionalComponent(__VLS_5, new __VLS_5({
        label: "公共图库（默认）",
        value: "",
    }));
    const __VLS_7 = __VLS_6({
        label: "公共图库（默认）",
        value: "",
    }, ...__VLS_functionalComponentArgsRest(__VLS_6));
}
for (const [space] of __VLS_getVForSourceType((__VLS_ctx.selectOptions))) {
    const __VLS_9 = {}.ElOption;
    /** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
    // @ts-ignore
    const __VLS_10 = __VLS_asFunctionalComponent(__VLS_9, new __VLS_9({
        key: (space.id),
        label: (space.spaceName),
        value: (space.id),
    }));
    const __VLS_11 = __VLS_10({
        key: (space.id),
        label: (space.spaceName),
        value: (space.id),
    }, ...__VLS_functionalComponentArgsRest(__VLS_10));
    __VLS_12.slots.default;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (space.spaceName);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "muted-text" },
    });
    (space.spaceType === 1 ? '团队空间' : '个人空间');
    var __VLS_12;
}
var __VLS_3;
/** @type {__VLS_StyleScopedClasses['muted-text']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            loading: loading,
            innerValue: innerValue,
            selectOptions: selectOptions,
        };
    },
    __typeEmits: {},
    __typeProps: {},
    props: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {
            ...__VLS_exposed,
        };
    },
    __typeEmits: {},
    __typeProps: {},
    props: {},
});
; /* PartiallyEnd: #4569/main.vue */
