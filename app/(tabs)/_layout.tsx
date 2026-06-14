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
        tabBarInactiveTintColor: "#8B7D73",
        tabBarStyle: {
          backgroundColor: "#FFF8EA",
          borderTopColor: "rgba(126,88,48,0.18)",
          borderTopWidth: 1,
          paddingTop: 7,
          paddingBottom: bottomPad,
          height: 58 + bottomPad,
          shadowColor: "#2B1A12",
          shadowOpacity: 0.08,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: -4 },
        },
        tabBarLabelStyle: { fontSize: 10, fontFamily: F.serif, fontWeight: "700", marginTop: 1 },
      }}
    >
      <Tabs.Screen name="today" options={{ title: "今日", tabBarIcon: ({ color, focused }) => <TabGlyph color={color} focused={focused} label="○" /> }} />
      <Tabs.Screen name="pace" options={{ title: "ペース", tabBarIcon: ({ color, focused }) => <TabGlyph color={color} focused={focused} label="◇" /> }} />
      <Tabs.Screen name="relations" options={{ title: "つながり", tabBarIcon: ({ color, focused }) => <TabGlyph color={color} focused={focused} label="∞" /> }} />
      <Tabs.Screen name="journal" options={{ title: "振り返り", tabBarIcon: ({ color, focused }) => <TabGlyph color={color} focused={focused} label="✎" /> }} />
      <Tabs.Screen name="profile" options={{ title: "あなた", tabBarIcon: ({ color, focused }) => <TabGlyph color={color} focused={focused} label="✦" /> }} />
    </Tabs>
  );
}

function TabGlyph({ color, focused, label }: { color: string; focused: boolean; label: string }) {
  return (
    <Text
      style={{
        color,
        fontSize: focused ? 17 : 15,
        lineHeight: 20,
        fontWeight: focused ? "800" : "600",
      }}
    >
      {label}
    </Text>
  );
}
