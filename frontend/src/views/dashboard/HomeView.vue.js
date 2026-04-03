import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getPictureTagCategory, listPicturesByPage } from '@/api/picture';
import { formatDateTime } from '@/utils/format';
const route = useRoute();
const router = useRouter();
const loading = ref(false);
const loadingMore = ref(false);
const pictures = ref([]);
const categoryOptions = ref([]);
const tagOptions = ref([]);
const activeCategory = ref('全部');
const activeTag = ref('');
const loadMoreRef = ref(null);
const searchForm = reactive({
    keyword: '',
});
const pagination = reactive({
    current: 1,
    pageSize: 20,
    total: 0,
});
const categoryTabs = computed(() => ['全部', ...categoryOptions.value]);
const hasMore = computed(() => pictures.value.length < pagination.total);
const showLoadMore = computed(() => pictures.value.length > 0 && hasMore.value);
let observer = null;
function syncKeywordFromRoute() {
    searchForm.keyword = typeof route.query.q === 'string' ? route.query.q : '';
}
function buildQuery() {
    return {
        current: pagination.current,
        pageSize: pagination.pageSize,
        searchText: searchForm.keyword || undefined,
        name: searchForm.keyword || undefined,
        category: activeCategory.value === '全部' ? undefined : activeCategory.value,
        tags: activeTag.value ? [activeTag.value] : undefined,
        sortField: 'createTime',
        sortOrder: 'descend',
    };
}
function mergePictures(list) {
    const map = new Map();
    [...pictures.value, ...list].forEach((item) => {
        map.set(String(item.id), item);
    });
    pictures.value = Array.from(map.values());
}
async function loadMeta() {
    const result = await getPictureTagCategory();
    categoryOptions.value = result.categoryList || [];
    tagOptions.value = result.tagList || [];
}
async function fetchPictures(options = {}) {
    const { reset = false } = options;
    if (reset) {
        loading.value = true;
    }
    else {
        loadingMore.value = true;
    }
    try {
        const result = await listPicturesByPage(buildQuery());
        pagination.total = Number(result.total || 0);
        const records = result.records || [];
        if (reset) {
            pictures.value = records;
        }
        else {
            mergePictures(records);
        }
    }
    finally {
        loading.value = false;
        loadingMore.value = false;
    }
}
async function reloadPictures() {
    pagination.current = 1;
    pictures.value = [];
    await fetchPictures({ reset: true });
    await nextTick();
    setupObserver();
}
async function loadMorePictures() {
    if (!hasMore.value || loading.value || loadingMore.value) {
        return;
    }
    pagination.current += 1;
    try {
        await fetchPictures();
    }
    catch (error) {
        pagination.current -= 1;
        throw error;
    }
}
function disconnectObserver() {
    if (observer) {
        observer.disconnect();
        observer = null;
    }
}
function setupObserver() {
    disconnectObserver();
    if (!loadMoreRef.value) {
        return;
    }
    observer = new IntersectionObserver((entries) => {
        const firstEntry = entries[0];
        if (firstEntry?.isIntersecting) {
            loadMorePictures();
        }
    }, {
        rootMargin: '180px 0px',
        threshold: 0,
    });
    observer.observe(loadMoreRef.value);
}
async function handleSearch() {
    const nextKeyword = searchForm.keyword.trim();
    const currentKeyword = typeof route.query.q === 'string' ? route.query.q : '';
    if (nextKeyword === currentKeyword) {
        await reloadPictures();
        return;
    }
    await router.replace({
        path: '/dashboard',
        query: nextKeyword ? { q: nextKeyword } : {},
    });
}
async function handleCategoryChange(category) {
    activeCategory.value = category;
    await reloadPictures();
}
async function handleTagChange(tag) {
    activeTag.value = activeTag.value === tag ? '' : tag;
    await reloadPictures();
}
watch(() => route.query.q, async () => {
    syncKeywordFromRoute();
    await reloadPictures();
});
watch(loadMoreRef, async () => {
    await nextTick();
    setupObserver();
});
onMounted(async () => {
    syncKeywordFromRoute();
    await loadMeta();
    await reloadPictures();
});
onBeforeUnmount(() => {
    disconnectObserver();
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "app-page" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "surface-panel" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "surface-panel-body" },
    ...{ style: {} },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "hero-search" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "hero-search-box" },
});
const __VLS_0 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ 'onKeyup': {} },
    modelValue: (__VLS_ctx.searchForm.keyword),
    placeholder: "从海量图片中搜索",
}));
const __VLS_2 = __VLS_1({
    ...{ 'onKeyup': {} },
    modelValue: (__VLS_ctx.searchForm.keyword),
    placeholder: "从海量图片中搜索",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_4;
let __VLS_5;
let __VLS_6;
const __VLS_7 = {
    onKeyup: (__VLS_ctx.handleSearch)
};
var __VLS_3;
const __VLS_8 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
    ...{ 'onClick': {} },
    type: "primary",
}));
const __VLS_10 = __VLS_9({
    ...{ 'onClick': {} },
    type: "primary",
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
let __VLS_12;
let __VLS_13;
let __VLS_14;
const __VLS_15 = {
    onClick: (__VLS_ctx.handleSearch)
};
__VLS_11.slots.default;
var __VLS_11;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: {} },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "filter-tabs" },
});
for (const [category] of __VLS_getVForSourceType((__VLS_ctx.categoryTabs))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.handleCategoryChange(category);
            } },
        key: (category),
        type: "button",
        ...{ class: "filter-tab" },
        ...{ class: ({ active: __VLS_ctx.activeCategory === category }) },
    });
    (category);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.hr)({
    ...{ class: "soft-divider" },
    ...{ style: {} },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "tag-line" },
    ...{ style: {} },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ style: {} },
});
for (const [tag] of __VLS_getVForSourceType((__VLS_ctx.tagOptions))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.handleTagChange(tag);
            } },
        key: (tag),
        type: "button",
        ...{ class: "tag-chip" },
        ...{ class: ({ active: __VLS_ctx.activeTag === tag }) },
    });
    (tag);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "gallery-grid" },
});
__VLS_asFunctionalDirective(__VLS_directives.vLoading)(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.loading) }, null, null);
for (const [picture] of __VLS_getVForSourceType((__VLS_ctx.pictures))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.router.push(`/pictures/${picture.id}`);
            } },
        key: (picture.id),
        ...{ class: "gallery-card clickable" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
        src: (picture.thumbnailUrl || picture.url),
        ...{ class: "gallery-cover" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "gallery-body" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
        ...{ class: "gallery-title" },
    });
    (picture.name || `图片 ${picture.id}`);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "gallery-desc" },
    });
    (picture.category || '未分类');
    if (picture.tags?.length) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (picture.tags.join(' / '));
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "inline-tags" },
        ...{ style: {} },
    });
    const __VLS_16 = {}.ElTag;
    /** @type {[typeof __VLS_components.ElTag, typeof __VLS_components.elTag, typeof __VLS_components.ElTag, typeof __VLS_components.elTag, ]} */ ;
    // @ts-ignore
    const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
        type: "success",
        round: true,
    }));
    const __VLS_18 = __VLS_17({
        type: "success",
        round: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_17));
    __VLS_19.slots.default;
    var __VLS_19;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "muted-text" },
        ...{ style: {} },
    });
    (__VLS_ctx.formatDateTime(picture.createTime));
}
if (!__VLS_ctx.pictures.length && !__VLS_ctx.loading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "surface-panel empty-placeholder" },
    });
}
if (__VLS_ctx.pictures.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "surface-panel home-gallery-footer" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "home-gallery-footer-inner" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "muted-text" },
    });
    (__VLS_ctx.pictures.length);
    (__VLS_ctx.pagination.total);
    if (__VLS_ctx.showLoadMore) {
        const __VLS_20 = {}.ElButton;
        /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
        // @ts-ignore
        const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
            ...{ 'onClick': {} },
            type: "primary",
            plain: true,
            loading: (__VLS_ctx.loadingMore),
        }));
        const __VLS_22 = __VLS_21({
            ...{ 'onClick': {} },
            type: "primary",
            plain: true,
            loading: (__VLS_ctx.loadingMore),
        }, ...__VLS_functionalComponentArgsRest(__VLS_21));
        let __VLS_24;
        let __VLS_25;
        let __VLS_26;
        const __VLS_27 = {
            onClick: (__VLS_ctx.loadMorePictures)
        };
        __VLS_23.slots.default;
        var __VLS_23;
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "muted-text" },
        });
    }
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
    ref: "loadMoreRef",
    ...{ class: "load-more-anchor" },
});
/** @type {typeof __VLS_ctx.loadMoreRef} */ ;
/** @type {__VLS_StyleScopedClasses['app-page']} */ ;
/** @type {__VLS_StyleScopedClasses['surface-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['surface-panel-body']} */ ;
/** @type {__VLS_StyleScopedClasses['hero-search']} */ ;
/** @type {__VLS_StyleScopedClasses['hero-search-box']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-tabs']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-tab']} */ ;
/** @type {__VLS_StyleScopedClasses['soft-divider']} */ ;
/** @type {__VLS_StyleScopedClasses['tag-line']} */ ;
/** @type {__VLS_StyleScopedClasses['tag-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['gallery-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['gallery-card']} */ ;
/** @type {__VLS_StyleScopedClasses['clickable']} */ ;
/** @type {__VLS_StyleScopedClasses['gallery-cover']} */ ;
/** @type {__VLS_StyleScopedClasses['gallery-body']} */ ;
/** @type {__VLS_StyleScopedClasses['gallery-title']} */ ;
/** @type {__VLS_StyleScopedClasses['gallery-desc']} */ ;
/** @type {__VLS_StyleScopedClasses['inline-tags']} */ ;
/** @type {__VLS_StyleScopedClasses['muted-text']} */ ;
/** @type {__VLS_StyleScopedClasses['surface-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-placeholder']} */ ;
/** @type {__VLS_StyleScopedClasses['surface-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['home-gallery-footer']} */ ;
/** @type {__VLS_StyleScopedClasses['home-gallery-footer-inner']} */ ;
/** @type {__VLS_StyleScopedClasses['muted-text']} */ ;
/** @type {__VLS_StyleScopedClasses['muted-text']} */ ;
/** @type {__VLS_StyleScopedClasses['load-more-anchor']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            formatDateTime: formatDateTime,
            router: router,
            loading: loading,
            loadingMore: loadingMore,
            pictures: pictures,
            tagOptions: tagOptions,
            activeCategory: activeCategory,
            activeTag: activeTag,
            loadMoreRef: loadMoreRef,
            searchForm: searchForm,
            pagination: pagination,
            categoryTabs: categoryTabs,
            showLoadMore: showLoadMore,
            loadMorePictures: loadMorePictures,
            handleSearch: handleSearch,
            handleCategoryChange: handleCategoryChange,
            handleTagChange: handleTagChange,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
