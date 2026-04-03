import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AIOutpaintingPanel from '@/components/picture/AIOutpaintingPanel.vue';
const route = useRoute();
const pictureId = computed(() => typeof route.query.pictureId === 'string' ? route.query.pictureId : undefined);
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "page-shell" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "page-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({
    ...{ class: "page-title" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "page-subtitle" },
});
if (__VLS_ctx.pictureId) {
    const __VLS_0 = {}.ElTag;
    /** @type {[typeof __VLS_components.ElTag, typeof __VLS_components.elTag, typeof __VLS_components.ElTag, typeof __VLS_components.elTag, ]} */ ;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
        size: "large",
        type: "primary",
    }));
    const __VLS_2 = __VLS_1({
        size: "large",
        type: "primary",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    __VLS_3.slots.default;
    (__VLS_ctx.pictureId);
    var __VLS_3;
}
/** @type {[typeof AIOutpaintingPanel, ]} */ ;
// @ts-ignore
const __VLS_4 = __VLS_asFunctionalComponent(AIOutpaintingPanel, new AIOutpaintingPanel({
    pictureId: (__VLS_ctx.pictureId),
}));
const __VLS_5 = __VLS_4({
    pictureId: (__VLS_ctx.pictureId),
}, ...__VLS_functionalComponentArgsRest(__VLS_4));
/** @type {__VLS_StyleScopedClasses['page-shell']} */ ;
/** @type {__VLS_StyleScopedClasses['page-header']} */ ;
/** @type {__VLS_StyleScopedClasses['page-title']} */ ;
/** @type {__VLS_StyleScopedClasses['page-subtitle']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            AIOutpaintingPanel: AIOutpaintingPanel,
            pictureId: pictureId,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
