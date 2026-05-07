<script lang="ts">
    import { page } from "$app/state";
    import ShopMenu from "$lib/components/shop/ShopMenu.svelte";
</script>

<div class="page-container">
    <ShopMenu shopId={page.params.id || ""} />
</div>

<style>
    .page-container {
        padding: 1rem;
    }
</style>
