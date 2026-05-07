export interface RegisterData {
    username: string;
    email: string;
    password: string;
}

export interface LoginData {
    email: string;
    password: string;
}

export interface ResetPasswordData {
    token: string;
    password: string;
}

export interface ChangePasswordData {
    currentPassword: string;
    newPassword: string;
}

export interface EventData {
    name: string;
    description: string;
    location: string;
    latitude: number;
    longitude: number;
    startDate: string; // ISO Date
    finishDate: string; // ISO Date
}

export interface ShopRegisterData {
    shopName: string;
    userId: string;
    latitude: number;
    longitude: number;
}

export interface ShopUpdateData {
    name: string;
    openDate: string | null;  // ISO timestamp
    closeDate: string | null; // ISO timestamp
    latitude: number;
    longitude: number;
}

export interface DishAddData {
    shopId: string;
    name: string;
    description: string;
    price: number;
    available: boolean;
    stock: number;
}

export interface DishUpdateData {
    name: string;
    description: string;
    price: number;
    available: boolean;
    stock: number;
}

export interface OrderCreateData {
    foodtruckId: string;
    pickUpDate: string; // ISO Date
    dishes: { dishId: string; quantity: number }[];
}

export interface ReviewCreateData {
    text: string;
    date: string; // ISO Date
}

// ── Entity Models (Backend) ──


export interface UserEntity {
    id: string;
    username: string;
    email: string;
    role: 'USER' | 'OWNER' | 'ADMIN';
    avatar: string | null;
    isVerified: boolean;
    resetPasswordToken: string | null;
    resetPasswordExpires: string | null;
    verificationToken: string | null;
    verificationTokenExpires: string | null;
}

export interface ShopEntity {
    id: string;
    name: string;
    ownerId: string;
    state: 'OPEN' | 'CLOSED';
    openDate: string | null;    // timestamp
    closeDate: string | null;   // timestamp
    latitude: number;
    longitude: number;
}

export interface DishEntity {
    id: string;
    shopId: string;
    name: string;
    description: string;
    price: number;
    available: boolean;
    stock: number;
}

export interface EventEntity {
    id: string;
    name: string;
    description: string;
    location: string;
    latitude: number;
    longitude: number;
    startDate: string;
    finishDate: string;
}

export interface OrderEntity {
    id: string;
    userId: string;
    shopId: string;
    eventId: string | null;
    pickUpDate: string;
    state: 'PENDING' | 'CANCELLED' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DELIVERED';
    changeReason: string;
}

export interface OrderDishEntity {
    id: string;
    orderId: string;
    dishId: string;
    quantity: number;
    unitaryPrice: number;
}

export interface ReviewEntity {
    id: string;
    userId: string;
    orderId: string;
    shopId: string;
    text: string;
    date: string;
}

export interface ShopEventEntity {
    id: string;
    eventId: string;
    shopId: string;
    active: boolean;
}

export interface TicketEntity {
    id: string;
    userId: string;
    userID?: string;
    shopName: string;
    message: string;
    latitude: number;
    longitude: number;
    accepted: boolean;
    createdAt: Date;
    user?: { username: string; avatar: string | null; email?: string; };
    username?: string;
    avatar?: string | null;
    email?: string;
}

export interface NotificationEntity {
    id: string;
    title: string;
    message: string;
    userId: string | null;  // null = broadcast (para todos)
    isRead: boolean;
    createdAt: Date;
}

export type SupportTicketStatus = 'OPEN' | 'IN_PROGRESS' | 'CLOSED';

export interface SupportTicketEntity {
    id: string;
    userId: string;
    subject: string;
    description: string;
    status: SupportTicketStatus;
    createdAt: Date;
    // Enriched fields (admin list)
    username?: string;
    avatar?: string | null;
    email?: string;
}
