import * as fs from 'fs';
import * as path from 'path';

export interface DatasetProduct {
  id: string;
  storeId: string;
  storeName: string;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  mrp: number;
  unit: string;
  sku: string;
  availableQty: number;
  reservedQty: number;
  lowStockThreshold: number;
  stockStatus: string;
  isActive: boolean;
  imageUrl: string;
  rating: number;
  createdAt: string;
  updatedAt: string;
}

export interface DatasetStore {
  id: string;
  name: string;
  slug: string;
  description: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
  email: string;
  bannerUrl: string;
  logoUrl: string | null;
  rating: number;
  latitude: number;
  longitude: number;
  deliveryRadiusKm: number;
  isActive: boolean;
  ownerName: string;
  totalProducts: number;
}

export interface DatasetOrder {
  id: string;
  orderNumber: string;
  timestamp: string;
  customer: {
    userId: string;
    name: string;
    email: string;
    phone: string;
  };
  store: {
    storeId: string;
    name: string;
    address: string;
  };
  deliveryAddress: {
    label: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    latitude: number;
    longitude: number;
  };
  items: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
    subtotal: number;
    unit: string;
  }>;
  billing: {
    subtotal: number;
    deliveryFee: number;
    tax: number;
    totalAmount: number;
  };
  payment: {
    transactionId: string;
    method: string;
    status: string;
    paidAt: string;
  };
  orderStatus: string;
  deliveryAssignment?: {
    riderName: string;
    riderPhone: string;
    vehicle: string;
    status: string;
    currentLat?: number;
    currentLng?: number;
    estimatedDeliveryMins?: number;
    deliveredAt?: string;
  };
}

class DatasetStoreManager {
  private dataDir = this.resolveDataDir();
  private productsFile = path.resolve(this.dataDir, 'products_dataset.json');
  private storesFile = path.resolve(this.dataDir, 'stores_dataset.json');
  private ordersFile = path.resolve(this.dataDir, 'orders_dataset.json');

  private productsCache: DatasetProduct[] = [];
  private storesCache: DatasetStore[] = [];
  private ordersCache: DatasetOrder[] = [];

  private resolveDataDir(): string {
    const candidates = [
      path.resolve(process.cwd(), 'data'),
      path.resolve(process.cwd(), '..', '..', 'data'),
      path.resolve(__dirname, '..', '..', '..', '..', 'data'),
      path.resolve(__dirname, '..', '..', '..', 'data'),
    ];
    for (const dir of candidates) {
      if (fs.existsSync(path.join(dir, 'products_dataset.json'))) {
        return dir;
      }
    }
    return candidates[0];
  }

  constructor() {
    this.reloadAll();
  }

  public reloadAll() {
    this.dataDir = this.resolveDataDir();
    this.productsFile = path.resolve(this.dataDir, 'products_dataset.json');
    this.storesFile = path.resolve(this.dataDir, 'stores_dataset.json');
    this.ordersFile = path.resolve(this.dataDir, 'orders_dataset.json');

    try {
      if (fs.existsSync(this.productsFile)) {
        this.productsCache = JSON.parse(fs.readFileSync(this.productsFile, 'utf8'));
      }
      if (fs.existsSync(this.storesFile)) {
        this.storesCache = JSON.parse(fs.readFileSync(this.storesFile, 'utf8'));
      }
      if (fs.existsSync(this.ordersFile)) {
        this.ordersCache = JSON.parse(fs.readFileSync(this.ordersFile, 'utf8'));
      }
    } catch (e) {
      console.warn('DatasetStoreManager: Error reading datasets from disk:', e);
    }
  }

  // --- Products ---
  public getProducts(): DatasetProduct[] {
    if (this.productsCache.length === 0) this.reloadAll();
    return this.productsCache;
  }

  public getProductById(id: string): DatasetProduct | undefined {
    return this.getProducts().find((p) => p.id === id || p.slug === id);
  }

  public updateProductStock(productId: string, delta: number, type = 'RESTOCK'): DatasetProduct | null {
    const products = this.getProducts();
    const prod = products.find((p) => p.id === productId || p.slug === productId);
    if (!prod) return null;

    if (type === 'RESTOCK' || delta > 0) {
      prod.availableQty += Math.abs(delta);
    } else {
      prod.availableQty = Math.max(0, prod.availableQty - Math.abs(delta));
    }

    prod.stockStatus =
      prod.availableQty === 0
        ? 'OUT_OF_STOCK'
        : prod.availableQty <= prod.lowStockThreshold
        ? 'LOW_STOCK'
        : 'IN_STOCK';
    prod.updatedAt = new Date().toISOString();

    this.saveProducts();
    return prod;
  }

  public addProduct(product: Partial<DatasetProduct>): DatasetProduct {
    const products = this.getProducts();
    const newId = `prod-${products.length + 1}`;
    const fullProd: DatasetProduct = {
      id: newId,
      storeId: product.storeId || 'store-1',
      storeName: product.storeName || 'Sunrise Fresh Market',
      categoryId: product.categoryId || 'cat-1',
      categoryName: product.categoryName || 'Fresh Fruits',
      categorySlug: product.categorySlug || 'fresh-fruits',
      name: product.name || 'New Product',
      slug: (product.name || 'product').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: product.description || '',
      price: product.price || 99,
      mrp: product.mrp || 120,
      unit: product.unit || '1 unit',
      sku: product.sku || `SKU-${Date.now()}`,
      availableQty: product.availableQty || 50,
      reservedQty: 0,
      lowStockThreshold: product.lowStockThreshold || 10,
      stockStatus: 'IN_STOCK',
      isActive: true,
      imageUrl: product.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
      rating: 4.8,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    products.unshift(fullProd);
    this.saveProducts();
    return fullProd;
  }

  private saveProducts() {
    try {
      fs.writeFileSync(this.productsFile, JSON.stringify(this.productsCache, null, 2), 'utf8');
    } catch (e) {
      console.error('Error saving products dataset:', e);
    }
  }

  // --- Stores ---
  public getStores(): DatasetStore[] {
    if (this.storesCache.length === 0) this.reloadAll();
    return this.storesCache;
  }

  public getStoreById(id: string): DatasetStore | undefined {
    return this.getStores().find((s) => s.id === id || s.slug === id);
  }

  public updateStore(storeId: string, updates: Partial<DatasetStore>): DatasetStore | null {
    const stores = this.getStores();
    const store = stores.find((s) => s.id === storeId || s.slug === storeId) || stores[0];
    if (!store) return null;

    Object.assign(store, updates);
    try {
      fs.writeFileSync(this.storesFile, JSON.stringify(this.storesCache, null, 2), 'utf8');
    } catch (e) {
      console.error('Error saving stores dataset:', e);
    }
    return store;
  }

  // --- Orders ---
  public getOrders(): DatasetOrder[] {
    if (this.ordersCache.length === 0) this.reloadAll();
    return this.ordersCache;
  }

  public getOrderById(id: string): DatasetOrder | undefined {
    return this.getOrders().find((o) => o.id === id || o.orderNumber === id);
  }

  public createOrder(orderData: Partial<DatasetOrder>): DatasetOrder {
    const orders = this.getOrders();
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `PRN-${dateStr}-${randomSuffix}`;
    const id = `ord-${Date.now()}`;

    const newOrder: DatasetOrder = {
      id,
      orderNumber,
      timestamp: new Date().toISOString(),
      customer: orderData.customer || {
        userId: 'demo-customer-id',
        name: 'Prerna Panel Customer',
        email: 'customer@gmail.com',
        phone: '+91 99887 00000',
      },
      store: orderData.store || {
        storeId: 'store-1',
        name: 'Sunrise Fresh Market',
        address: 'Shop 14-16, Galleria Market, DLF Phase 4, Gurugram',
      },
      deliveryAddress: orderData.deliveryAddress || {
        label: 'Home',
        street: 'Flat 502, DLF Cyber City Towers, Sector 25',
        city: 'Gurugram',
        state: 'Haryana',
        postalCode: '122002',
        latitude: 28.4682,
        longitude: 77.0384,
      },
      items: orderData.items || [],
      billing: orderData.billing || {
        subtotal: 0,
        deliveryFee: 25,
        tax: 0,
        totalAmount: 25,
      },
      payment: orderData.payment || {
        transactionId: `TXN_PAY_${dateStr}_${Math.floor(1000 + Math.random() * 9000)}`,
        method: 'TEST_PAYMENT',
        status: 'COMPLETED',
        paidAt: new Date().toISOString(),
      },
      orderStatus: 'CONFIRMED',
      deliveryAssignment: {
        riderName: 'Vikram Singh (Electric Bike)',
        riderPhone: '+91 98765 43213',
        vehicle: 'Ather 450X - DL 01 EX 2026',
        status: 'ASSIGNED',
        currentLat: 28.465,
        currentLng: 77.0865,
        estimatedDeliveryMins: 10,
      },
    };

    // Atomically decrement stock for purchased items
    if (newOrder.items && newOrder.items.length > 0) {
      for (const item of newOrder.items) {
        this.updateProductStock(item.productId, item.quantity, 'DEDUCT');
      }
    }

    orders.unshift(newOrder);
    try {
      fs.writeFileSync(this.ordersFile, JSON.stringify(this.ordersCache, null, 2), 'utf8');
    } catch (e) {
      console.error('Error saving orders dataset:', e);
    }

    return newOrder;
  }
}

export const datasetStore = new DatasetStoreManager();
