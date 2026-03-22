import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="w-full border-t border-border/10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 mt-auto">
      <div className="container py-8 md:py-12 mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary tracking-tight">
              <img src="/logos/logo-hhkungfu.png" alt="Hhkungfu Logo" className="h-24 w-auto hover:opacity-90 transition-opacity" />
            </Link>
            <p className="text-sm text-muted-foreground text-center md:text-left">
              © {new Date().getFullYear()} Hhkungfu. Mọi quyền được bảo lưu.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-sm font-medium text-muted-foreground">
            <Link to="/about" className="hover:text-primary transition-colors">Về chúng tôi</Link>
            <Link to="/terms" className="hover:text-primary transition-colors">Điều khoản</Link>
            <Link to="/privacy" className="hover:text-primary transition-colors">Bảo mật</Link>
            <Link to="/contact" className="hover:text-primary transition-colors">Liên hệ</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
