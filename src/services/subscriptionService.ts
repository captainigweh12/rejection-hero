import { Platform, Linking, Alert } from 'react-native';

// Conditionally import InAppPurchases only if available
let InAppPurchases: any = null;
try {
  InAppPurchases = require('expo-in-app-purchases');
} catch (error) {
  console.log('⚠️ [IAP] expo-in-app-purchases not available in this build');
}

// Product IDs for your in-app purchases
// These should match what you configure in App Store Connect and Google Play Console
export const PRODUCT_IDS = {
  PREMIUM_MONTHLY: Platform.select({
    ios: 'com.vibecode.goforno.premium.monthly',
    android: 'com.vibecode.goforno.premium.monthly',
  }) as string,
  PREMIUM_YEARLY: Platform.select({
    ios: 'com.vibecode.goforno.premium.yearly',
    android: 'com.vibecode.goforno.premium.yearly',
  }) as string,
};

let isInitialized = false;

/**
 * Check if IAP is available in this build
 */
export const isIAPAvailable = (): boolean => {
  return InAppPurchases !== null;
};

/**
 * Initialize the in-app purchase connection
 */
export const initializeIAP = async (): Promise<boolean> => {
  try {
    if (!isIAPAvailable()) {
      console.log('⚠️ [IAP] Not available - requires native build with expo-in-app-purchases');
      return false;
    }

    if (isInitialized) {
      return true;
    }

    await InAppPurchases.connectAsync();
    const responseCode = InAppPurchases.IAPResponseCode.OK;

    if (responseCode === InAppPurchases.IAPResponseCode.OK) {
      console.log('✅ [IAP] Initialized successfully');
      isInitialized = true;

      // Set up purchase listener
      InAppPurchases.setPurchaseListener(({ responseCode, results, errorCode }: any) => {
        if (responseCode === InAppPurchases.IAPResponseCode.OK) {
          results?.forEach((purchase: any) => {
            if (!purchase.acknowledged) {
              console.log('✅ [IAP] Purchase successful:', purchase.productId);
              // Here you would verify the purchase with your backend
              // and then finish the transaction
              finishPurchase(purchase);
            }
          });
        } else if (responseCode === InAppPurchases.IAPResponseCode.USER_CANCELED) {
          console.log('ℹ️ [IAP] User canceled purchase');
        } else if (responseCode === InAppPurchases.IAPResponseCode.DEFERRED) {
          console.log('⏳ [IAP] Purchase deferred');
        } else {
          console.error('❌ [IAP] Purchase error:', errorCode);
        }
      });

      return true;
    } else {
      console.error('❌ [IAP] Failed to initialize:', responseCode);
      return false;
    }
  } catch (error) {
    console.error('❌ [IAP] Error initializing:', error);
    return false;
  }
};

/**
 * Get available products
 */
export const getProducts = async () => {
  try {
    if (!isIAPAvailable()) {
      return [];
    }

    const { responseCode, results } = await InAppPurchases.getProductsAsync(
      Object.values(PRODUCT_IDS)
    );

    if (responseCode === InAppPurchases.IAPResponseCode.OK) {
      console.log('✅ [IAP] Products loaded:', results);
      return results || [];
    } else {
      console.error('❌ [IAP] Failed to load products:', responseCode);
      return [];
    }
  } catch (error) {
    console.error('❌ [IAP] Error loading products:', error);
    return [];
  }
};

/**
 * Purchase a product
 */
export const purchaseProduct = async (productId: string) => {
  try {
    if (!isIAPAvailable()) {
      return false;
    }

    await InAppPurchases.purchaseItemAsync(productId);
    console.log('✅ [IAP] Purchase initiated for:', productId);
    return true;
  } catch (error) {
    console.error('❌ [IAP] Purchase error:', error);
    return false;
  }
};

/**
 * Finish/acknowledge a purchase
 */
export const finishPurchase = async (purchase: any) => {
  try {
    if (!isIAPAvailable()) {
      return;
    }

    await InAppPurchases.finishTransactionAsync(purchase, true);
    console.log('✅ [IAP] Purchase finished:', purchase.productId);
  } catch (error) {
    console.error('❌ [IAP] Error finishing purchase:', error);
  }
};

/**
 * Restore purchases
 */
export const restorePurchases = async () => {
  try {
    if (!isIAPAvailable()) {
      return [];
    }

    const { responseCode, results } = await InAppPurchases.getPurchaseHistoryAsync();

    if (responseCode === InAppPurchases.IAPResponseCode.OK) {
      console.log('✅ [IAP] Purchases restored:', results);
      return results || [];
    } else {
      console.error('❌ [IAP] Failed to restore purchases:', responseCode);
      return [];
    }
  } catch (error) {
    console.error('❌ [IAP] Error restoring purchases:', error);
    return [];
  }
};

/**
 * Show upgrade dialog with platform-appropriate action
 */
export const showUpgradeDialog = (onUpgrade?: () => void) => {
  Alert.alert(
    "🚀 Upgrade to Premium",
    "You've reached your free quest limit! Upgrade to create unlimited AI-powered quests and unlock all premium features.",
    [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Upgrade Now",
        style: "default",
        onPress: async () => {
          if (Platform.OS === 'ios' || Platform.OS === 'android') {
            // Check if IAP is available in this build
            if (!isIAPAvailable()) {
              Alert.alert(
                "Build Required",
                "In-app purchases require a production build with native modules. For now, please contact support to upgrade your account.",
                [{ text: "OK", style: "cancel" }]
              );
              return;
            }

            // Mobile: Use in-app purchases
            const initialized = await initializeIAP();

            if (initialized) {
              const products = await getProducts();

              if (products.length > 0) {
                // Show product selection
                Alert.alert(
                  "Select Plan",
                  "Choose your premium subscription plan:",
                  [
                    {
                      text: "Cancel",
                      style: "cancel",
                    },
                    ...products.map((product: any) => ({
                      text: `${product.title} - ${product.price}`,
                      onPress: async () => {
                        const success = await purchaseProduct(product.productId);
                        if (success) {
                          onUpgrade?.();
                        }
                      },
                    })),
                  ]
                );
              } else {
                Alert.alert(
                  "Products Not Available",
                  "Unable to load subscription plans. Please try again later or contact support.",
                  [{ text: "OK", style: "cancel" }]
                );
              }
            } else {
              Alert.alert(
                "Setup Required",
                "In-app purchases are not available yet. Please update the app or contact support.",
                [{ text: "OK", style: "cancel" }]
              );
            }
          } else {
            // Web: Redirect to Stripe
            Alert.alert(
              "Redirect to Checkout",
              "You'll be redirected to our secure checkout page.",
              [
                {
                  text: "Cancel",
                  style: "cancel",
                },
                {
                  text: "Continue",
                  onPress: () => {
                    // TODO: Replace with your actual Stripe checkout URL
                    const stripeUrl = "https://buy.stripe.com/your-payment-link";
                    Linking.openURL(stripeUrl);
                  },
                },
              ]
            );
          }
        },
      },
    ]
  );
};
