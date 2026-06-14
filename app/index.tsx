import { Redirect } from "expo-router";
import { useUser } from "../lib/store";

export default function Entry() {
  const { isOnboarded, pillars, hasHydrated } = useUser();
  if (!hasHydrated) return null;
  if (isOnboarded && pillars) return <Redirect href="/today" />;
  return <Redirect href="/welcome" />;
}
