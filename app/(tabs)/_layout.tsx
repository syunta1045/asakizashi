import { Tabs } from "expo-router";
import { Text, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { C, F } from "../../lib/theme";

export default function TabsLayout() {
  // Android 11+ のジェスチャーナビゲーションだと bottom inset がそれなりに大きいので
  // tabBar の paddingBottom と height を端末ごとに動的に決める。
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, Platform.OS === "ios" ? 18 : 12);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.red,
        tabBarInactiveTintColor: C.inkMuted,
        tabBarStyle: {
          backgroundColor: C.white95,
          borderTopColor: C.paperBorder,
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: bottomPad,
          height: 56 + bottomPad,
        },
        tabBarLabelStyle: { fontSize: 10, fontFamily: F.serif },
      }}
    >
      <Tabs.Screen name="today" options={{ title: "今日", tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 14 }}>○</Text> }} />
      <Tabs.Screen name="ranking" options={{ title: "順位", tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 14 }}>◇</Text> }} />
      <Tabs.Screen name="relations" options={{ title: "つながり", tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 14 }}>◯◯</Text> }} />
      <Tabs.Screen name="journal" options={{ title: "振り返り", tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 14 }}>✎</Text> }} />
      <Tabs.Screen name="profile" options={{ title: "あなた", tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 14 }}>✦</Text> }} />
    </Tabs>
  );
}
