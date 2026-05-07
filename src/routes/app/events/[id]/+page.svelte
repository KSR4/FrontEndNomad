<script lang="ts">
    import { page } from "$app/state";
    import EventDetail from "$lib/components/event/EventDetail.svelte";

    let eventId = $derived(page.params.id as string);
</script>

<EventDetail {eventId} />
