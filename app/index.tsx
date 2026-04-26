import { Redirect } from "expo-router";
import { useUser } from "../lib/store";

export default function Entry() {
  const { isOnboarded, pillars } = useUser();
  if (isOnboarded && pillars) return <Redirect href="/today" />;
  return <Redirect href="/welcome" />;
}
