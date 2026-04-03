import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { searchPictureByColor } from '@/api/picture';
import SpaceSelect from '@/components/space/SpaceSelect.vue';
const router = useRouter();
const loading = ref(false);
const spaceId = ref('');
const colorValue = ref('#409EFF');
const results = ref([]);
async function handleSearch() {
    if (!spaceId.value) {
        ElMessage.warning('请先选择一个私有空间');
        return;
    }
    loading.value = true;
    try {
        results.value = await searchPictureByColor({
            spaceId: spaceId.value,
            picColor: colorValue.value,
        });
    }
    finally {
        loading.value = false;
    }
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['color-search-form']} */ ;
// CSS variable injection 
// CSS variable injection end 
const __VLS_0 = {}.ElCard;
/** @type {[typeof __VLS_components.ElCard, typeof __VLS_components.elCard, typeof __VLS_components.ElCard, typeof __VLS_components.elCard, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    shadow: "never",
}));
const __VLS_2 = __VLS_1({
    shadow: "never",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
var __VLS_4 = {};
__VLS_3.slots.default;
{
    const { header: __VLS_thisSlot } = __VLS_3.slots;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "color-search-header" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section-title" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section-subtitle" },
    });
    const __VLS_5 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_6 = __VLS_asFunctionalComponent(__VLS_5, new __VLS_5({
        ...{ 'onClick': {} },
        type: "primary",
        loading: (__VLS_ctx.loading),
    }));
    const __VLS_7 = __VLS_6({
        ...{ 'onClick': {} },
        type: "primary",
        loading: (__VLS_ctx.loading),
    }, ...__VLS_functionalComponentArgsRest(__VLS_6));
    let __VLS_9;
    let __VLS_10;
    let __VLS_11;
    const __VLS_12 = {
        onClick: (__VLS_ctx.handleSearch)
    };
    __VLS_8.slots.default;
    var __VLS_8;
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "color-search-form" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "color-search-field" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "color-search-label" },
});
/** @type {[typeof SpaceSelect, ]} */ ;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent(SpaceSelect, new SpaceSelect({
    modelValue: (__VLS_ctx.spaceId),
    includePublic: (false),
    placeholder: "选择要搜索的空间",
}));
const __VLS_14 = __VLS_13({
    modelValue: (__VLS_ctx.spaceId),
    includePublic: (false),
    placeholder: "选择要搜索的空间",
}, ...__VLS_functionalComponentArgsRest(__VLS_13));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "color-search-field" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "color-search-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "color-input-row" },
});
const __VLS_16 = {}.ElColorPicker;
/** @type {[typeof __VLS_components.ElColorPicker, typeof __VLS_components.elColorPicker, ]} */ ;
// @ts-ignore
const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
    modelValue: (__VLS_ctx.colorValue),
}));
const __VLS_18 = __VLS_17({
    modelValue: (__VLS_ctx.colorValue),
}, ...__VLS_functionalComponentArgsRest(__VLS_17));
const __VLS_20 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
    modelValue: (__VLS_ctx.colorValue),
    ...{ style: {} },
    placeholder: "#409EFF",
}));
const __VLS_22 = __VLS_21({
    modelValue: (__VLS_ctx.colorValue),
    ...{ style: {} },
    placeholder: "#409EFF",
}, ...__VLS_functionalComponentArgsRest(__VLS_21));
if (__VLS_ctx.results.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "result-grid" },
    });
    for (const [item] of __VLS_getVForSourceType((__VLS_ctx.results))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.results.length))
                        return;
                    __VLS_ctx.router.push(`/pictures/${item.id}`);
                } },
            key: (item.id),
            ...{ class: "result-card clickable" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
            src: (item.thumbnailUrl || item.url),
            ...{ class: "result-image" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "result-name" },
        });
        (item.name || `图片 ${item.id}`);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "muted-text" },
        });
        (item.picColor || __VLS_ctx.colorValue);
    }
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "empty-placeholder" },
    });
}
var __VLS_3;
/** @type {__VLS_StyleScopedClasses['color-search-header']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['section-subtitle']} */ ;
/** @type {__VLS_StyleScopedClasses['color-search-form']} */ ;
/** @type {__VLS_StyleScopedClasses['color-search-field']} */ ;
/** @type {__VLS_StyleScopedClasses['color-search-label']} */ ;
/** @type {__VLS_StyleScopedClasses['color-search-field']} */ ;
/** @type {__VLS_StyleScopedClasses['color-search-label']} */ ;
/** @type {__VLS_StyleScopedClasses['color-input-row']} */ ;
/** @type {__VLS_StyleScopedClasses['result-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['result-card']} */ ;
/** @type {__VLS_StyleScopedClasses['clickable']} */ ;
/** @type {__VLS_StyleScopedClasses['result-image']} */ ;
/** @type {__VLS_StyleScopedClasses['result-name']} */ ;
/** @type {__VLS_StyleScopedClasses['muted-text']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-placeholder']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            SpaceSelect: SpaceSelect,
            router: router,
            loading: loading,
            spaceId: spaceId,
            colorValue: colorValue,
            results: results,
            handleSearch: handleSearch,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
