import { useEffect } from "react";
import { useDeckStore } from "./lib/useStore";
import { WarRoomCanvas } from "./scene/WarRoomCanvas";
import { HudOverlay } from "./hud/HudOverlay";
import { LoginScreen } from "./hud/LoginScreen";

export default function App() {
  const authenticated = useDeckStore((s) => s.authenticated);
  const demoMode = useDeckStore((s) => s.demoMode);
  const loadFlows = useDeckStore((s) => s.loadFlows);

  // 首屏尝试恢复会话（cookie 仍在则直接载入）
  useEffect(() => {
    loadFlows().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!authenticated && !demoMode) {
    return <LoginScreen />;
  }

  return (
    <div className="deck-root">
      <WarRoomCanvas />
      <HudOverlay />
    </div>
  );
}
