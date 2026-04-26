/**
 * オフライン時のみ表示される薄いバナー
 */
import { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { C, F } from "../lib/theme";

export function OfflineBanner() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const sub = NetInfo.addEventListener((state) => {
      setOnline(Boolean(state.isConnected && state.isInternetReachable !== false));
    });
    return () => sub();
  }, []);
  if (online) return null;
  return (
    <View style={s.bar}>
      <Text style={s.text}>オフラインです — ローカルのデータを表示しています</Text>
    </View>
  );
}

const s = StyleSheet.create({
  bar: { backgroundColor: C.warn, paddingVertical: 6, alignItems: "center" },
  text: { color: C.white, fontSize: 11, fontFamily: F.serif, letterSpacing: 1 },
});
