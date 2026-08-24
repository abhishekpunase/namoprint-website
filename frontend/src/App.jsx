import { Suspense, lazy } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AdminProtectedRoute } from './components/layout/AdminProtectedRoute'
import { AppLayout } from './components/layout/AppLayout'
import { CartSync } from './components/layout/CartSync'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { WishlistProvider } from './context/WishlistContext'
import { DesignProvider } from './context/DesignContext'
import FloatingWhatsApp from './components/layout/FloatingWhatsApp'

const named = (loader, exportName) =>
  lazy(() => loader().then((mod) => ({ default: mod[exportName] })))

const AdminLayout = named(() => import('./components/layout/AdminLayout'), 'AdminLayout')

const HomePage = named(() => import('./pages/HomePage'), 'HomePage')
const CatalogPage = named(() => import('./pages/CatalogPage'), 'CatalogPage')
const WishlistPage = named(() => import('./pages/WishlistPage'), 'WishlistPage')
const ProductDesignerPage = named(() => import('./pages/ProductDesignerPage'), 'ProductDesignerPage')
const CategoryPage = lazy(() => import('./pages/CategoryPage'))
const AboutPage = named(() => import('./pages/AboutPage'), 'AboutPage')
const ContactPage = named(() => import('./pages/ContactPage'), 'ContactPage')
const BulkOrdersPage = named(() => import('./pages/Bulk-ordersPage'), 'BulkOrdersPage')
const PrivacyPolicyPage = named(() => import('./pages/Privacy-policyPage'), 'PrivacyPolicyPage')
const TermsAndConditionsPage = named(() => import('./pages/TermsAndConditionsPage'), 'TermsAndConditionsPage')
const RefundPolicyPage = named(() => import('./pages/RefundPolicyPage'), 'RefundPolicyPage')
const ShippingPolicyPage = named(() => import('./pages/ShippingPolicyPage'), 'ShippingPolicyPage')
const FaqPage = named(() => import('./pages/FaqPage'), 'FaqPage')
const LoginPage = named(() => import('./pages/LoginPage'), 'LoginPage')
const RegisterPage = named(() => import('./pages/RegisterPage'), 'RegisterPage')
const ForgotPasswordPage = named(() => import('./pages/ForgotPasswordPage'), 'ForgotPasswordPage')
const ResetPasswordPage = named(() => import('./pages/ResetPasswordPage'), 'ResetPasswordPage')
const CartPage = named(() => import('./pages/CartPage'), 'CartPage')
const CheckoutPage = named(() => import('./pages/CheckoutPage'), 'CheckoutPage')
const PaymentSuccessPage = named(() => import('./pages/PaymentSuccessPage'), 'PaymentSuccessPage')
const AccountPage = named(() => import('./pages/AccountPage'), 'AccountPage')
const OrdersPage = named(() => import('./pages/OrdersPage'), 'OrdersPage')
const NotFoundPage = named(() => import('./pages/NotFoundPage'), 'NotFoundPage')

const GodPhotosPage = lazy(() => import('./pages/GodPhotosPage'))
const GodProductDetailPage = lazy(() => import('./pages/GodProductDetailPage'))
const NamePlatePage = lazy(() => import('./pages/NamePlatePage'))
const NamePlateProductDetailPage = lazy(() => import('./pages/NamePlateProductDetailPage'))
const CorporateGiftPage = lazy(() => import('./pages/CorporateGiftPage'))
const CorporateGiftProductDetailPage = lazy(() => import('./pages/CorporateGiftProductDetailPage'))
const BabyBirthFramePage = lazy(() => import('./pages/BabyBirthFramePage'))
const BabyBirthFrameProductDetailPage = lazy(() => import('./pages/BabyBirthFrameProductDetailPage'))
const TrophyPage = lazy(() => import('./pages/TrophyPage'))
const TrophyProductDetailPage = lazy(() => import('./pages/TrophyProductDetailPage'))
const PenPrintPage = lazy(() => import('./pages/PenPrintPage'))
const PenPrintProductDetailPage = lazy(() => import('./pages/PenPrintProductDetailPage'))
const UvDtfStickerPage = lazy(() => import('./pages/UvDtfStickerPage'))
const UvDtfStickerProductDetailPage = lazy(() => import('./pages/UvDtfStickerProductDetailPage'))
const ProductLabelStickerPage = lazy(() => import('./pages/ProductLabelStickerPage'))
const ProductLabelStickerProductDetailPage = lazy(() => import('./pages/ProductLabelStickerProductDetailPage'))
const TShirtPage = lazy(() => import('./pages/TShirtPage'))
const TShirtProductDetailPage = lazy(() => import('./pages/TShirtProductDetailPage'))
const WallWatchPage = lazy(() => import('./pages/WallWatchPage'))
const WallWatchDesignerPage = lazy(() => import('./pages/WallWatchDesignerPage'))

const AdminLoginPage = named(() => import('./pages/admin/AdminLoginPage'), 'AdminLoginPage')
const AdminDashboardPage = named(() => import('./pages/admin/AdminDashboardPage'), 'AdminDashboardPage')
const AdminOrdersPage = named(() => import('./pages/admin/AdminOrdersPage'), 'AdminOrdersPage')
const AdminOrderDetailPage = named(() => import('./pages/admin/AdminOrderDetailPage'), 'AdminOrderDetailPage')
const AdminProductsPage = named(() => import('./pages/admin/AdminProductsPage'), 'AdminProductsPage')
const AdminProductCreatePage = named(() => import('./pages/admin/AdminProductFormPage'), 'AdminProductCreatePage')
const AdminProductDetailPage = named(() => import('./pages/admin/AdminProductDetailPage'), 'AdminProductDetailPage')
const AdminProductEditRoutePage = named(() => import('./pages/admin/AdminProductDetailPage'), 'AdminProductEditRoutePage')
const AdminGodProductsPage = named(() => import('./pages/admin/AdminGodProductsPage'), 'AdminGodProductsPage')
const AdminNamePlateProductsPage = named(() => import('./pages/admin/AdminNamePlateProductsPage'), 'AdminNamePlateProductsPage')
const AdminCorporateGiftProductsPage = named(() => import('./pages/admin/AdminCorporateGiftProductsPage'), 'AdminCorporateGiftProductsPage')
const AdminBabyBirthFrameProductsPage = named(() => import('./pages/admin/AdminBabyBirthFrameProductsPage'), 'AdminBabyBirthFrameProductsPage')
const AdminTrophyProductsPage = named(() => import('./pages/admin/AdminTrophyProductsPage'), 'AdminTrophyProductsPage')
const AdminPenPrintProductsPage = named(() => import('./pages/admin/AdminPenPrintProductsPage'), 'AdminPenPrintProductsPage')
const AdminUvDtfStickerProductsPage = named(() => import('./pages/admin/AdminUvDtfStickerProductsPage'), 'AdminUvDtfStickerProductsPage')
const AdminProductLabelStickerProductsPage = named(
  () => import('./pages/admin/AdminProductLabelStickerProductsPage'),
  'AdminProductLabelStickerProductsPage',
)
const AdminTShirtProductsPage = named(() => import('./pages/admin/AdminTShirtProductsPage'), 'AdminTShirtProductsPage')
const AdminWallWatchProductsPage = named(() => import('./pages/admin/AdminWallWatchProductsPage'), 'AdminWallWatchProductsPage')
const AdminCategoriesPage = named(() => import('./pages/admin/AdminCategoriesPage'), 'AdminCategoriesPage')
const AdminCategoryCreatePage = named(() => import('./pages/admin/AdminCategoryFormPage'), 'AdminCategoryCreatePage')
const AdminCategoryDetailPage = named(() => import('./pages/admin/AdminCategoryDetailPage'), 'AdminCategoryDetailPage')
const AdminCategoryEditRoutePage = named(() => import('./pages/admin/AdminCategoryDetailPage'), 'AdminCategoryEditRoutePage')
const AdminUsersPage = named(() => import('./pages/admin/AdminUsersPage'), 'AdminUsersPage')
const AdminUserDetailPage = named(() => import('./pages/admin/AdminUserDetailPage'), 'AdminUserDetailPage')
const AdminCustomersPage = named(() => import('./pages/admin/AdminCustomersPage'), 'AdminCustomersPage')
const AdminCustomerDetailPage = named(() => import('./pages/admin/AdminCustomerDetailPage'), 'AdminCustomerDetailPage')
const AdminInventoryPage = named(() => import('./pages/admin/AdminInventoryPage'), 'AdminInventoryPage')
const AdminInventoryDetailPage = named(() => import('./pages/admin/AdminInventoryDetailPage'), 'AdminInventoryDetailPage')
const AdminCouponsPage = named(() => import('./pages/admin/AdminCouponsPage'), 'AdminCouponsPage')
const AdminCouponCreatePage = named(() => import('./pages/admin/AdminCouponCreatePage'), 'AdminCouponCreatePage')
const AdminCouponDetailPage = named(() => import('./pages/admin/AdminCouponDetailPage'), 'AdminCouponDetailPage')
const AdminCouponEditPage = named(() => import('./pages/admin/AdminCouponCreatePage'), 'AdminCouponEditPage')
const AdminMediaPage = named(() => import('./pages/admin/AdminMediaPage'), 'AdminMediaPage')
const AdminHomeSlidesPage = named(() => import('./pages/admin/AdminHomeSlidesPage'), 'AdminHomeSlidesPage')
const AdminHomeTestimonialsPage = named(() => import('./pages/admin/AdminHomeTestimonialsPage'), 'AdminHomeTestimonialsPage')
const AdminHomeOfferMarqueePage = named(() => import('./pages/admin/AdminHomeOfferMarqueePage'), 'AdminHomeOfferMarqueePage')
const AdminCategoryCarouselPage = named(() => import('./pages/admin/AdminCategoryCarouselPage'), 'AdminCategoryCarouselPage')
const AdminProductReelsPage = named(() => import('./pages/admin/AdminProductReelsPage'), 'AdminProductReelsPage')
const AdminIntegrationsPage = named(() => import('./pages/admin/AdminIntegrationsPage'), 'AdminIntegrationsPage')
const AdminAnalyticsPage = named(() => import('./pages/admin/AdminAnalyticsPage'), 'AdminAnalyticsPage')
const AdminReviewsPage = named(() => import('./pages/admin/AdminReviewsPage'), 'AdminReviewsPage')
const AdminRolesPage = named(() => import('./pages/admin/AdminRolesPage'), 'AdminRolesPage')
const AdminNotificationsPage = named(() => import('./pages/admin/AdminNotificationsPage'), 'AdminNotificationsPage')
const AdminSystemPage = named(() => import('./pages/admin/AdminSystemPage'), 'AdminSystemPage')
const AdminSettingsIndexPage = named(() => import('./pages/admin/AdminSettingsPage'), 'AdminSettingsIndexPage')
const AdminSettingsPage = named(() => import('./pages/admin/AdminSettingsPage'), 'AdminSettingsPage')
const AdminProfilePage = named(() => import('./pages/admin/AdminProfilePage'), 'AdminProfilePage')

function RouteFallback() {
  return (
    <div className="grid min-h-[calc(100dvh-8rem)] place-items-center p-6">
      <div className="sys-skeleton w-full max-w-3xl min-h-[120px] rounded-xl" />
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
          <DesignProvider>
            <CartSync />
            <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route
                path="/admin"
                element={
                  <AdminProtectedRoute>
                    <AdminLayout />
                  </AdminProtectedRoute>
                }
              >
                <Route index element={<AdminDashboardPage />} />
                <Route path="orders" element={<AdminOrdersPage />} />
                <Route path="orders/:id" element={<AdminOrderDetailPage />} />
                <Route path="products" element={<AdminProductsPage />} />
                <Route path="products/new" element={<AdminProductCreatePage />} />
                <Route path="products/:id" element={<AdminProductDetailPage />} />
                <Route path="products/:id/edit" element={<AdminProductEditRoutePage />} />
                <Route path="god-photo-frames" element={<AdminGodProductsPage />} />
                <Route path="name-plates" element={<AdminNamePlateProductsPage />} />
                <Route path="corporate-gifts" element={<AdminCorporateGiftProductsPage />} />
                <Route path="baby-birth-frames" element={<AdminBabyBirthFrameProductsPage />} />
                <Route path="trophies" element={<AdminTrophyProductsPage />} />
                <Route path="pen-print" element={<AdminPenPrintProductsPage />} />
                <Route path="uv-dtf-stickers" element={<AdminUvDtfStickerProductsPage />} />
                <Route path="product-label-stickers" element={<AdminProductLabelStickerProductsPage />} />
                <Route path="t-shirt-printing" element={<AdminTShirtProductsPage />} />
                <Route path="wall-watches" element={<AdminWallWatchProductsPage />} />
                <Route path="categories" element={<AdminCategoriesPage />} />
                <Route path="categories/new" element={<AdminCategoryCreatePage />} />
                <Route path="categories/:id" element={<AdminCategoryDetailPage />} />
                <Route path="categories/:id/edit" element={<AdminCategoryEditRoutePage />} />
                <Route path="users" element={<AdminUsersPage />} />
                <Route path="users/:id" element={<AdminUserDetailPage />} />
                <Route path="customers" element={<AdminCustomersPage />} />
                <Route path="customers/:id" element={<AdminCustomerDetailPage />} />
                <Route path="inventory" element={<AdminInventoryPage />} />
                <Route path="inventory/product/:productId" element={<AdminInventoryDetailPage />} />
                <Route path="coupons" element={<AdminCouponsPage />} />
                <Route path="coupons/new" element={<AdminCouponCreatePage />} />
                <Route path="coupons/:code" element={<AdminCouponDetailPage />} />
                <Route path="coupons/:code/edit" element={<AdminCouponEditPage />} />
                <Route path="media" element={<AdminMediaPage />} />
                <Route path="home-slides" element={<AdminHomeSlidesPage />} />
                <Route path="home-testimonials" element={<AdminHomeTestimonialsPage />} />
                <Route path="home-offer-marquee" element={<AdminHomeOfferMarqueePage />} />
                <Route path="category-carousel" element={<AdminCategoryCarouselPage />} />
                <Route path="product-reels" element={<AdminProductReelsPage />} />
                <Route path="integrations" element={<AdminIntegrationsPage />} />
                <Route path="analytics" element={<AdminAnalyticsPage />} />
                <Route path="reviews" element={<AdminReviewsPage />} />
                <Route path="roles" element={<AdminRolesPage />} />
                <Route path="notifications" element={<AdminNotificationsPage />} />
                <Route path="system" element={<AdminSystemPage />} />
                <Route path="settings" element={<AdminSettingsIndexPage />} />
                <Route path="settings/:section" element={<AdminSettingsPage />} />
                <Route path="profile" element={<AdminProfilePage />} />
              </Route>

              <Route element={<AppLayout />}>
                <Route index element={<HomePage />} />
                <Route path="products" element={<CatalogPage />} />
                <Route path="wishlist" element={<WishlistPage />} />
                <Route path="products/:slug" element={<ProductDesignerPage />} />
                <Route path="category/:categoryType" element={<CategoryPage />} />
                <Route path="god-photo-frames" element={<GodPhotosPage />} />
                <Route path="god-photo-frames/:slug" element={<GodProductDetailPage />} />
                <Route path="name-plates" element={<NamePlatePage />} />
                <Route path="name-plates/:slug" element={<NamePlateProductDetailPage />} />
                <Route path="corporate-gifts" element={<CorporateGiftPage />} />
                <Route path="corporate-gifts/:slug" element={<CorporateGiftProductDetailPage />} />
                <Route path="baby-birth-frames" element={<BabyBirthFramePage />} />
                <Route path="baby-birth-frames/:slug" element={<BabyBirthFrameProductDetailPage />} />
                <Route path="trophies" element={<TrophyPage />} />
                <Route path="trophies/:slug" element={<TrophyProductDetailPage />} />
                <Route path="pen-print" element={<PenPrintPage />} />
                <Route path="pen-print/:slug" element={<PenPrintProductDetailPage />} />
                <Route path="uv-dtf-stickers" element={<UvDtfStickerPage />} />
                <Route path="uv-dtf-stickers/:slug" element={<UvDtfStickerProductDetailPage />} />
                <Route path="product-label-stickers" element={<ProductLabelStickerPage />} />
                <Route path="product-label-stickers/:slug" element={<ProductLabelStickerProductDetailPage />} />
                <Route path="t-shirt-printing" element={<TShirtPage />} />
                <Route path="t-shirt-printing/:slug" element={<TShirtProductDetailPage />} />
                <Route path="custom-wall-watches" element={<WallWatchPage />} />
                <Route path="custom-wall-watches/:slug" element={<WallWatchDesignerPage />} />
                <Route path="about" element={<AboutPage />} />
                <Route path="contact" element={<ContactPage />} />
                <Route path="bulk-orders" element={<BulkOrdersPage />} />
                <Route path="privacy-policy" element={<PrivacyPolicyPage />} />
                <Route path="terms-and-conditions" element={<TermsAndConditionsPage />} />
                <Route path="refund-policy" element={<RefundPolicyPage />} />
                <Route path="shipping-policy" element={<ShippingPolicyPage />} />
                <Route path="faq" element={<FaqPage />} />
                <Route path="login" element={<LoginPage />} />
                <Route path="register" element={<RegisterPage />} />
                <Route path="forgot-password" element={<ForgotPasswordPage />} />
                <Route path="reset-password" element={<ResetPasswordPage />} />
                <Route
                  path="cart"
                  element={
                    <ProtectedRoute>
                      <CartPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="checkout"
                  element={
                    <ProtectedRoute>
                      <CheckoutPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="payment-success"
                  element={
                    <ProtectedRoute>
                      <PaymentSuccessPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="account"
                  element={
                    <ProtectedRoute>
                      <AccountPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="account/orders"
                  element={
                    <ProtectedRoute>
                      <OrdersPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
            </Suspense>
             <FloatingWhatsApp />
          </DesignProvider>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
