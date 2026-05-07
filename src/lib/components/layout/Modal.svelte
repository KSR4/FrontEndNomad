<script lang="ts">
    import { fade, scale } from "svelte/transition";

    interface Props {
        show: boolean;
        title: string;
        onClose: () => void;
        children?: import("svelte").Snippet;
        footer?: import("svelte").Snippet;
    }

    let { show, title, onClose, children, footer }: Props = $props();

    function handleBackdropClick(e: MouseEvent) {
        if (e.target === e.currentTarget) {
            onClose();
        }
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Escape" && show) {
            onClose();
        }
    }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if show}
    <div
        class="modal-backdrop"
        onclick={handleBackdropClick}
        transition:fade={{ duration: 200 }}
        role="presentation"
    >
        <div
            class="modal-card"
            transition:scale={{ duration: 200, start: 0.95 }}
        >
            <div class="modal-header">
                <h3>{title}</h3>
                <button
                    class="close-btn"
                    onclick={onClose}
                    aria-label="Close modal"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        ><line x1="18" y1="6" x2="6" y2="18"></line><line
                            x1="6"
                            y1="6"
                            x2="18"
                            y2="18"
                        ></line></svg
                    >
                </button>
            </div>

            <div class="modal-content">
                {#if children}
                    {@render children()}
                {/if}
            </div>

            {#if footer}
                <div class="modal-footer">
                    {@render footer()}
                </div>
            {/if}
        </div>
    </div>
{/if}

<style>
    .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background-color: rgba(15, 23, 42, 0.4);
        backdrop-filter: blur(4px);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }

    .modal-card {
        background: white;
        width: 90%;
        max-width: 440px;
        border-radius: 24px;
        box-shadow:
            0 10px 25px -5px rgba(0, 0, 0, 0.1),
            0 8px 10px -6px rgba(0, 0, 0, 0.1);
        border: 1px solid #e2e8f0;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    .modal-header {
        padding: 1.5rem 2rem 1rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .modal-header h3 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 700;
        color: #1e293b;
    }

    .close-btn {
        background: none;
        border: none;
        color: #94a3b8;
        cursor: pointer;
        padding: 4px;
        border-radius: 8px;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .close-btn:hover {
        background-color: #f1f5f9;
        color: #64748b;
    }

    .modal-content {
        padding: 0.5rem 2rem 1.5rem;
        color: #64748b;
        font-size: 1rem;
        line-height: 1.5;
    }

    .modal-footer {
        padding: 1rem 2rem 1.5rem;
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
        background-color: #f8fafc;
        border-top: 1px solid #f1f5f9;
    }

    :global(.modal-footer button) {
        padding: 0.6rem 1.2rem;
        border-radius: 12px;
        font-size: 0.95rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        border: none;
    }

    :global(.modal-footer .cancel-btn) {
        background: white;
        color: #64748b;
        border: 1px solid #e2e8f0;
    }

    :global(.modal-footer .cancel-btn:hover) {
        background: #f1f5f9;
        color: #1e293b;
    }

    :global(.modal-footer .confirm-btn) {
        background-color: #ef4444;
        color: white;
    }

    :global(.modal-footer .confirm-btn:hover) {
        background-color: #dc2626;
        transform: translateY(-1px);
    }
</style>
