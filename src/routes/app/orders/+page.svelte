<script lang="ts">
    import OrdersView from "$lib/components/shop/OrdersView.svelte";
</script>

<div class="page-container">
    <OrdersView />
</div>

<style>
    .page-container {
        width: 100%;
        max-width: 1400px;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }
</style>
