
export type ContentfulItemEntry = {
    id: string;
    category: string; // e.g., 'electronics', 'clothing', 'furniture', etc.
    title: string;
    description: string;
    condition: "New" | "New - Like New" | "New - Other" | "Refurbished" | "Used" | "Used - Like New" | "Used - Very Good" | "Used - Good" | "Used - Acceptable" | "Used - For Parts"; // e.g., 'new', 'used - like new', 'used - good', etc.
    price: number;
    priceCurrency: string; // ISO 4217 currency code, e.g., 'USD'
    quantity: number;
    isShippable: boolean; // indicates if the item requires shipping
    weight: number; // numeric weight value
    weightUnit: "oz" | "lb" | "g" | "kg"; // e.g., 'lb', 'kg'
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
    title: string;
    startDate: string;
    endDate: string;
    schedule: string;
    duration: string;
    location: string; // could be a physical address or virtual meeting link
    locationType: "Physical" | "Virtual" | "Hybrid"; // e.g., 'physical', 'virtual', 'hybrid'
    price: number;
    priceCurrency: string; // ISO 4217 currency code, e.g., 'USD'
    maxSeats: number;
    description: string;
    status: string;
    image: string;
    isShippable: boolean; // indicates if the event / item requires shipping
    weight: number; // numeric weight value
    weightUnit: "oz" | "lb" | "g" |"kg"; // e.g., 'lb', 'kg'
}