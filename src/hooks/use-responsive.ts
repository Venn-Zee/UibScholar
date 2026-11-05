import { usePathname } from "expo-router";
import { useWindowDimensions } from "react-native";

/** Lebar maksimum kolom untuk halaman biasa (form, detail, profil). */
export const MAX_APP_WIDTH = 680;

/** Lebar maksimum untuk halaman daftar yang memakai grid beberapa kolom (tablet). */
export const MAX_WIDE_WIDTH = 1280;

/** Lebar maksimum untuk halaman admin. */
export const MAX_ADMIN_WIDTH = 900;

/** Lebar maksimum isi form (login, daftar, reset password) agar tidak melebar di tablet. */
export const MAX_FORM_WIDTH = 480;

// Halaman daftar yang tampil sebagai grid di layar lebar.
const WIDE_ROUTES = ["/home", "/explore", "/saved", "/profile", "/peneliti", "/program-studi"];

const GUTTER = 20; // padding kiri/kanan halaman (px-5)
const GRID_GAP = 12;

/** Lebar maksimum kolom aplikasi untuk sebuah route. */
export function frameMaxWidth(pathname: string) {
  if (pathname.startsWith("/admin")) return MAX_ADMIN_WIDTH;
  return WIDE_ROUTES.includes(pathname) ? MAX_WIDE_WIDTH : MAX_APP_WIDTH;
}

/**
 * Ukuran layar efektif untuk layout yang adaptif (HP kecil sampai tablet).
 * - contentWidth: lebar kolom aplikasi yang benar-benar dipakai
 * - isSmall: HP berlayar sempit (< 360 dp)
 * - isShort: layar pendek (< 640 dp)
 * - authPadding: padding horizontal halaman form
 * - columns / gridItemWidth / gridGap: jumlah kolom grid kartu (1 di HP, 2-3 di tablet)
 */
export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const pathname = usePathname();

  const contentWidth = Math.min(width, frameMaxWidth(pathname));
  const isSmall = contentWidth < 360;
  const isWideRoute = WIDE_ROUTES.includes(pathname);
  const columns = isWideRoute ? (contentWidth >= 900 ? 3 : contentWidth >= 600 ? 2 : 1) : 1;
  const gridItemWidth =
    columns > 1 ? Math.floor((contentWidth - GUTTER * 2 - GRID_GAP * (columns - 1)) / columns) : undefined;

  return {
    width,
    height,
    contentWidth,
    isSmall,
    isShort: height < 640,
    authPadding: isSmall ? 24 : contentWidth < 420 ? 32 : 40,
    columns,
    gridItemWidth,
    gridGap: GRID_GAP,
    gutter: GUTTER,
  };
}
