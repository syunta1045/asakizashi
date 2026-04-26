/**
 * 最上位の Error Boundary
 * 想定外のクラッシュ時に朝焼けのフォールバック画面を出す
 */
import { Component, ReactNode } from "react";
import { Text, Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { captureException } from "../lib/sentry";
import { C, dawnGradient, F } from "../lib/theme";

type Props = { children: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string }) {
    captureException(error, { componentStack: info.componentStack });
  }

  render() {
    if (this.state.error) {
      return (
        <LinearGradient colors={dawnGradient as unknown as [string, string, ...string[]]} style={s.bg}>
          <SafeAreaView style={s.center}>
            <Text style={s.title}>うまく読めませんでした</Text>
            <Text style={s.message}>少しだけ待ってから、もう一度お試しください。</Text>
            <Pressable style={s.retry} onPress={() => this.setState({ error: null })}>
              <Text style={s.retryText}>もう一度</Text>
            </Pressable>
            {__DEV__ && (
              <Text style={s.dev}>{String(this.state.error.message)}</Text>
            )}
          </SafeAreaView>
        </LinearGradient>
      );
    }
    return this.props.children;
  }
}

const s = StyleSheet.create({
  bg: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  title: { color: C.white, fontSize: 18, fontWeight: "500", textAlign: "center", lineHeight: 28, fontFamily: F.serif },
  message: { color: C.white, fontSize: 12, opacity: 0.85, marginTop: 12, textAlign: "center", lineHeight: 22, fontFamily: F.serif },
  retry: { marginTop: 28, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, borderWidth: 1, borderColor: C.gold, backgroundColor: C.paper },
  retryText: { color: C.ink, fontSize: 13, fontWeight: "600", letterSpacing: 4, fontFamily: F.serif },
  dev: { color: C.white, fontSize: 9, opacity: 0.5, marginTop: 24, textAlign: "center" },
});
