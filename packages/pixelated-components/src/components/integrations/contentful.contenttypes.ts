
export type ContentfulItemEntry = {
    id: string;
    category: string; // e.g., 'electronics', 'clothing', 'furniture', etc.
    title: string;
    description: string;
    condition: string; // e.g., 'new', 'used - like new', 'used - good', etc.
    price: number;
    priceCurrency: string; // ISO 4217 currency code, e.g., 'USD'
    quantity: number;
    weight: number; // numeric weight value
    weightUnit: string; // e.g., 'lb', 'kg'
    isShippable: boolean; // indicates if the item requires shipping
    brand: string;
    model: string;
    features: string[];
    color: string;
    date: string;
    material: string;
    vintage: boolean;
    personalized: boolean;
    images: string[];
}

export type ContentfulEventEntry = {
    id: string;
    category: string;
    weight: number; // numeric weight value
    weightUnit: string; // e.g., 'lb', 'kg'
    isShippable: boolean; // indicates if the event / item requires shipping
    title: string;
    startDate: string;
    endDate: string;
    schedule: string;
    duration: string;
    location: string; // could be a physical address or virtual meeting link
    locationType: string; // e.g., 'physical', 'virtual', 'hybrid'
    price: number;
    priceCurrency: string; // ISO 4217 currency code, e.g., 'USD'
    maxSeats: number;
    description: string;
    status: string;
    image: string;
}