export enum PhotoStyle {
  NATURAL_DAYLIGHT = 'Natural Elite',
  FINE_DINING = 'Michelin Editorial',
  MODERN_CASUAL = 'Casual Premium',
  LUXURY_GOLD_REFINED = 'Luxury Refined',
  LUXURY_GOLD_ULTRA = 'Ultra Premium',
  BURGER = 'Burger Hero',
  PIZZA = 'Pizza Michelin',
  PASTA = 'Pasta Nest',
  STEAK = 'Steak Maillard',
  ASIAN_DISHES = 'Asian Precision',
  SALAD = 'Salad Freshness',
  SOUPS_STEWS = 'Soup Gourmet',
  PLATED_DESSERT = 'Plated Dessert',
  WHOLE_CAKE = 'Layer Cake',
  BEVERAGES = 'Beverage Bar',
  BREAKFAST = 'Breakfast Elite',
  SANDWICH_WRAP = 'Sandwich Wrap',
  MEXICAN_DISHES = 'Mexican Vibrant',
  APPETIZERS = 'Appetizer Platter',
  SEAFOOD = 'Seafood Shellfish',
  PREMIUM_PASTA = 'Premium Risotto',
  GRILL_BBQ = 'Grill BBQ',
  VEGETARIAN_VEGAN = 'Plant Vibrant',
  PREMIUM_BRUNCH = 'Premium Brunch',
  SPECIAL_DESSERTS = 'Special Desserts',
  DARK_CINEMATIC = 'Cinematic Noir',
  MODERN_MINIMAL = 'Minimal Precision',
  EDITORIAL_CLEAN = 'Editorial Magazine',
  BRIGHT_CASUAL = 'Bright Lifestyle',
  MICHELIN_3_STAR = 'Clinical Precise',
  GARDEN_WHISPERS = 'Dawn Harvest',
  AZURE_TRENCH = 'Midnight Tide',
  FORGE_FLAME = 'Forge Flame',
  HIGH_ALTITUDE = 'Alpine Sanctuary',
  VELVET_FINALE = 'Victorian Study',
  LIQUID_ETHEREAL = 'Twilight Terrace',
}

export const STYLE_TOOLTIPS: Record<PhotoStyle, string> = {
  [PhotoStyle.NATURAL_DAYLIGHT]: "Natural window-light aesthetics (5600K). Soft organic shadows and clean, authentic daytime appeal.",
  [PhotoStyle.FINE_DINING]: "Precision plating and tweezers accuracy. High-end editorial lighting for Michelin-star perfection.",
  [PhotoStyle.MODERN_CASUAL]: "Vibrant, soft commercial lighting. Clean modern ceramics and a premium diner-perspective experience.",
  [PhotoStyle.LUXURY_GOLD_REFINED]: "Warm metallic accents and sophisticated golden glow. Balanced contrast for high-prestige presentation.",
  [PhotoStyle.LUXURY_GOLD_ULTRA]: "Maximum resolution and dramatic chiaroscuro lighting. Extensive gold-leaf aesthetics and ultimate luxury.",
  [PhotoStyle.BURGER]: "45° Hero Angle. Architectural layers, juicy patty reflections, and authentic bun textures.",
  [PhotoStyle.PIZZA]: "90° Overhead. Realistic char marks, bubbling cheese, and a subtle olive oil gleam.",
  [PhotoStyle.PASTA]: "Twirl architecture and glossy sauce emulsions. Elegant textures with fresh garnish focus.",
  [PhotoStyle.STEAK]: "Cross-hatch grill marks and perfect Maillard sear. Highlights internal color and succulent juices.",
  [PhotoStyle.ASIAN_DISHES]: "Cultural authenticity and grain separation. Vibrant ingredients with traditional prop styling.",
  [PhotoStyle.SALAD]: "Ultra-fresh crisp leaves and dewy water droplets. High-vibrancy contrast for garden-fresh appeal.",
  [PhotoStyle.SOUPS_STEWS]: "Velvety surface reflections and floating buoyancy. Zero-steam mandate for liquid clarity.",
  [PhotoStyle.PLATED_DESSERT]: "Complex layered textures and precise clean cuts. Artistic drizzle physics and sugar detail.",
  [PhotoStyle.WHOLE_CAKE]: "0° Eye Level height. Removal-slice internal reveal and gravity-correct frosting drips.",
  [PhotoStyle.BEVERAGES]: "Realistic condensation and crystal-clear ice. Backlighting for translucent brilliance and bar aesthetics.",
  [PhotoStyle.BREAKFAST]: "Perfect liquid yolk flow and morning light quality. Fluffy textures and syrup-drip physics.",
  [PhotoStyle.SANDWICH_WRAP]: "Diagonal layer reveal and textured artisan bread. Casual-premium styling and internal visibility.",
  [PhotoStyle.MEXICAN_DISHES]: "Festive vibrant palettes and abundant fillings. Realistic cheese-stretch and fresh ingredient focus.",
  [PhotoStyle.APPETIZERS]: "Geometric arrangement and functional props. Variety-focused overhead shots for social dining vibes.",
  [PhotoStyle.SEAFOOD]: "Crispy golden skin and glistening shellfish. Highlights freshness and delicate sea-inspired textures.",
  [PhotoStyle.PREMIUM_PASTA]: "Fine dining risotto or pasta with truffles. Focus on 'all'onda' wave-like textures.",
  [PhotoStyle.GRILL_BBQ]: "Authentic char marks and glistening glazes. Warm rustic lighting for a succulent, hearth-side look.",
  [PhotoStyle.VEGETARIAN_VEGAN]: "Wholesome vibrancy and natural textures. Focus on ingredient integrity and plant-based beauty.",
  [PhotoStyle.PREMIUM_BRUNCH]: "Weekend morning luxury. Hollandaise fluid physics and Instagram-worthy precision plating.",
  [PhotoStyle.SPECIAL_DESSERTS]: "Glossy mirror glazes and decadent signature sweets. Focus on irresistible sugar and cream textures.",
  [PhotoStyle.DARK_CINEMATIC]: "Dramatic shafts of light and moody shadows. Low-key lighting for a mysterious, high-end noir vibe.",
  [PhotoStyle.MODERN_MINIMAL]: "Sharp edges and negative space focus. Clean, clinical backgrounds for geometric plating.",
  [PhotoStyle.EDITORIAL_CLEAN]: "Magazine-style balance. Flawless studio lighting and perfectly centered commercial composition.",
  [PhotoStyle.BRIGHT_CASUAL]: "Sunny airy vibes. Weekend lifestyle aesthetics and colorful, approachable modern settings.",
  [PhotoStyle.MICHELIN_3_STAR]: "Phase One precision on black granite. Surgical plating and cold, clinical high-end studio lighting.",
  [PhotoStyle.GARDEN_WHISPERS]: "Earthy matte ceramics and dawn harvest light. Organic tones and micro-detail of fresh herbs.",
  [PhotoStyle.AZURE_TRENCH]: "Moody deep-sea blues and glass textures. Backlit 'sea foam' effects for premium seafood.",
  [PhotoStyle.FORGE_FLAME]: "Tungsten firelight and dark metal surfaces. High-texture focus on sear and hearth warmth.",
  [PhotoStyle.HIGH_ALTITUDE]: "Alpine high-key luxury. Textured porcelain and elegant edible gold highlights in a bright setting.",
  [PhotoStyle.VELVET_FINALE]: "Low-key dessert noir. Mirror-finish plates and deep velvet textures for late-night indulgence.",
  [PhotoStyle.LIQUID_ETHEREAL]: "Twilight refraction and crystal clarity. Violet and blue tones for premium mixology.",
};

export enum ImageSize {
  SIZE_1K = '1K',
  SIZE_2K = '2K',
  SIZE_4K = '4K',
}

export enum PhotoQuality {
  STANDARD = 'Standard',
  PREMIUM = 'Premium',
}

export type AspectRatio = '1:1' | '3:4' | '4:3' | '9:16' | '16:9';

export interface Dish {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  referencePhoto?: string;
  nutritionAnalysis?: string;
  logoImage?: string;
  locationImage?: string;
  magicLogoPrompt?: string;
  magicLocationPrompt?: string;
  isLoading: boolean;
  isEditing: boolean;
  isAnalyzing: boolean;
  error?: string;
}

export interface MenuAnalysisResult {
  dishes: { name: string; description: string; referencePhoto?: string }[];
}

export type GenerationConfig = {
  style: PhotoStyle;
  size: ImageSize;
  quality: PhotoQuality;
}

export type Currency = 'EUR' | 'USD' | 'RON';
export type UserRole = 'user' | 'admin';
export type AccountTier = 'FREE' | 'PREMIUM';
export type AccountStatus = 'PENDING_VERIFICATION' | 'ACTIVE' | 'SUSPENDED';

export interface User {
  id: string;
  googleId?: string;
  email: string;
  fullName: string;
  credits: number;
  freeCredits: number;
  purchasedCredits: number;
  dailyUsage: number;
  lastUsageDate: string;
  accountTier: AccountTier;
  accountStatus: AccountStatus;
  profilePhoto?: string;
  preferredCurrency: Currency;
  isLoggedIn: boolean;
  isEmailVerified: boolean;
  role: UserRole;
  joinedAt: string;
  totalGenerations: number;
  lastLogin?: string;
}

export interface CreditTransaction {
  id: string;
  type: 'purchase' | 'usage' | 'bonus' | 'refund' | 'expiration';
  amount: number;
  balanceAfter: number;
  description: string;
  date: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  creditsAffected: number;
  timestamp: string;
}
