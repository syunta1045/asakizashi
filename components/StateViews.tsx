/**
 * ローディング・エラー・空状態 の共通コンポーネント
 * 朝焼けの世界観を保ちながら状態表示
 */
import { Text, ActivityIndicator, Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { C, dawnGradient, F } from "../lib/theme";

export function LoadingView({ message = "読み込み中..." }: { message?: string }) {
  return (
    <LinearGradient colors={dawnGradient as unknown as [string, string, ...string[]]} style={s.bg}>
      <SafeAreaView style={s.center}>
        <ActivityIndicator size="large" color={C.white} />
        <Text style={s.message}>{message}</Text>
      </SafeAreaView>
    </LinearGradient>
  );
}

export function ErrorView({ title = "うまく読めませんでした", message, onRetry }: { title?: string; message?: string; onRetry?: () => void }) {
  return (
    <LinearGradient colors={dawnGradient as unknown as [string, string, ...string[]]} style={s.bg}>
      <SafeAreaView style={s.center}>
        <Text style={s.title}>{title}</Text>
        {message && <Text style={s.subtle}>{message}</Text>}
        {onRetry && (
          <Pressable style={s.retry} onPress={onRetry} accessibilityRole="button">
            <Text style={s.retryText}>もう一度試す</Text>
          </Pressable>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

/**
 * オフライン用フォールバック。「電波の届かない場所でも、命式は手元で読める」とトーンを保つ。
 */
export function OfflineView({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorView
      title="ネットにつながりません"
      message={"通信が不安定です。\n命式と今日の干支は手元で読み解いていますので、しばらくしてからもう一度お試しください。"}
      onRetry={onRetry}
    />
  );
}

/**
 * 任意のリストや状態が空のときに表示。世界観を壊さない柔らかい言葉。
 */
export function EmptyView({ title, message, action }: {
  title: string;
  message?: string;
  action?: { label: string; onPress: () => void };
}) {
  return (
    <LinearGradient colors={dawnGradient as unknown as [string, string, ...string[]]} style={s.bg}>
      <SafeAreaView style={s.center}>
        <Text style={s.title}>{title}</Text>
        {message && <Text style={s.subtle}>{message}</Text>}
        {action && (
          <Pressable style={s.retry} onPress={action.onPress} accessibilityRole="button">
            <Text style={s.retryText}>{action.label}</Text>
          </Pressable>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  bg: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  message: { color: C.white, fontSize: 12, opacity: 0.85, marginTop: 16, fontFamily: F.serif },
  title: { color: C.white, fontSize: 18, fontWeight: "500", textAlign: "center", lineHeight: 28, fontFamily: F.serif },
  subtle: { color: C.white, fontSize: 12, opacity: 0.85, marginTop: 12, textAlign: "center", lineHeight: 22 },
  retry: { marginTop: 28, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, borderWidth: 1, borderColor: C.gold, backgroundColor: C.paper },
  retryText: { color: C.ink, fontSize: 13, fontWeight: "600", letterSpacing: 4, fontFamily: F.serif },
});
