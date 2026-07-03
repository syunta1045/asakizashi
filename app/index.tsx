import { Redirect } from "expo-router";
import { useUser } from "../lib/store";

export default function Entry() {
  const { isOnboarded, hasHydrated } = useUser();
  if (!hasHydrated) return null;
  // pillars は任意（生年月日スキップ可）なので isOnboarded だけで判定する
  if (isOnboarded) return <Redirect href="/today" />;
  return <Redirect href="/welcome" />;
}
