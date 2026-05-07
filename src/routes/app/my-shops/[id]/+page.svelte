<script lang="ts">
    import { page } from "$app/state";
    import MyShopDetail from "$lib/components/shop/MyShopDetail.svelte";
</script>

<MyShopDetail shopId={page.params.id || ""} />
