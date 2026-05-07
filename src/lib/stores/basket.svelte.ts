export interface BasketItem {
    dishId: string;
    name: string;
    price: number;
    quantity: number;
}

export interface BasketState {
    shopId: string | null;
    shopName: string | null;
    openDate: string | null;
    closeDate: string | null;
    items: BasketItem[];
}

class Basket {
    state = $state<BasketState>({
        shopId: null,
        shopName: null,
        openDate: null,
        closeDate: null,
        items: []
    });

    addItem(
        shopId: string,
        shopName: string,
        dish: { id: string; name: string; price: number },
        openDate?: string | null,
        closeDate?: string | null
    ) {
        if (this.state.shopId && this.state.shopId !== shopId) {
            if (!confirm(`Ya tienes productos de "${this.state.shopName}". ¿Quieres vaciar la cesta para añadir platos de "${shopName}"?`)) {
                return;
            }
            this.clear();
        }

        this.state.shopId = shopId;
        this.state.shopName = shopName;
        this.state.openDate = openDate ?? null;
        this.state.closeDate = closeDate ?? null;

        const existing = this.state.items.find(i => i.dishId === dish.id);
        if (existing) {
            existing.quantity += 1;
        } else {
            this.state.items.push({
                dishId: dish.id,
                name: dish.name,
                price: dish.price,
                quantity: 1
            });
        }
    }

    removeItem(dishId: string) {
        const index = this.state.items.findIndex(i => i.dishId === dishId);
        if (index !== -1) {
            if (this.state.items[index].quantity > 1) {
                this.state.items[index].quantity -= 1;
            } else {
                this.state.items.splice(index, 1);
            }
        }

        if (this.state.items.length === 0) {
            this.clear();
        }
    }

    clear() {
        this.state.shopId = null;
        this.state.shopName = null;
        this.state.openDate = null;
        this.state.closeDate = null;
        this.state.items = [];
    }

    get totalItems() {
        return this.state.items.reduce((sum, item) => sum + item.quantity, 0);
    }

    get totalPrice() {
        return this.state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }
}

export const basket = new Basket();
