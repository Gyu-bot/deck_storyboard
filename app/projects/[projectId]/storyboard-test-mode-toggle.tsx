import { FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";

export function StoryboardTestModeToggle({ enabled }: { enabled: boolean }) {
  if (process.env.NODE_ENV === "production") return null;

  return (
    <form action="/api/dev/storyboard-test-mode" method="post">
      <input
        type="hidden"
        name="enabled"
        value={enabled ? "false" : "true"}
      />
      <Button type="submit" variant={enabled ? "default" : "outline"}>
        <FlaskConical className="size-4" aria-hidden="true" />
        {enabled ? "테스트 모드 끄기" : "테스트 모드 켜기"}
      </Button>
    </form>
  );
}
