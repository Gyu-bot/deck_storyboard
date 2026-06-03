import Link from "next/link";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LogoutButton({ size }: { size?: "default" | "sm" }) {
  return (
    <Button asChild variant="outline" size={size}>
      <Link href="/logout">
        <LogOut className="size-4" aria-hidden="true" />
        로그아웃
      </Link>
    </Button>
  );
}
