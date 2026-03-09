import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface NavLinkProps {
  to: string;
  end?: boolean;
  className?: string;
  activeClassName?: string;
  children: React.ReactNode;
  onClick?: () => void;
}

export function SidebarNavLink({ to, end, className, activeClassName, children, onClick }: NavLinkProps) {
  const location = useLocation();
  const isActive = end
    ? location.pathname === to
    : location.pathname.startsWith(to);

  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(className, isActive && activeClassName)}
    >
      {children}
    </Link>
  );
}
