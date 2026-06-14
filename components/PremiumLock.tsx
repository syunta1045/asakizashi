/**
 * プレミアム機能のロックオーバーレイ
 */
import { View, Text, Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { C, F } from "../lib/theme";

type Props = {
  title?: string;
  description?: string;
  cta?: string;
};

export function PremiumLock({
  title = "プレミアム機能",
  description = "テーマ別ヒントと記録の見返しを広げます",
  cta = "プレミアムを見る",
}: Props) {
  const router = useRouter();
  return (
    <View style={s.wrap}>
      <LinearGradient
        colors={[C.paper, C.paperDark]}
        style={s.card}
      >
        <View style={s.lockBadge}>
          <Text style={s.lockIcon}>◆</Text>
        </View>
        <Text style={s.title}>{title}</Text>
        <Text style={s.desc}>{description}</Text>
        <Pressable style={s.cta} onPress={() => router.push("/premium")}>
          <Text style={s.ctaText}>{cta}</Text>
        </Pressable>
      </LinearGradient>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 16 },
  card: { borderRadius: 18, padding: 24, alignItems: "center", borderWidth: 1, borderColor: C.paperBorder },
  lockBadge: { width: 56, height: 56, borderRadius: 28, backgroundColor: C.red, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  lockIcon: { color: C.white, fontSize: 22, fontFamily: F.serif },
  title: { color: C.ink, fontSize: 16, fontWeight: "600", marginTop: 4, textAlign: "center", fontFamily: F.serif },
  desc: { color: C.inkSub, fontSize: 12, marginTop: 8, textAlign: "center", lineHeight: 22, fontFamily: F.serif },
  cta: { marginTop: 18, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, backgroundColor: C.red },
  ctaText: { color: C.white, fontSize: 13, fontWeight: "600", letterSpacing: 4, fontFamily: F.serif },
});
