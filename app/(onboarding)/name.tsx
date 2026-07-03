import { View, Text, TextInput, StyleSheet } from "react-native";
import { useEffect } from "react";
import { useRouter } from "expo-router";
import { OnboardShell } from "../../components/OnboardShell";
import { useUser } from "../../lib/store";
import { track } from "../../lib/analytics";
import { C, F } from "../../lib/theme";

export default function NameStep() {
  const router = useRouter();
  const { nickname, setField } = useUser();
  const trimmedNickname = nickname.trim();
  const isInvalid = trimmedNickname.length === 0 || trimmedNickname.length > 20;
  useEffect(() => { track("onboarding_started"); }, []);

  const goNext = () => {
    if (isInvalid) return;
    setField("nickname", trimmedNickname);
    router.push("/(onboarding)/wake-up");
  };

  return (
    <OnboardShell
      step={1}
      total={3}
      title={"はじめまして。\n呼び名を決めましょう"}
      sub="朝メモで呼びかける名前です。あとからいつでも変更できます"
      onNext={goNext}
      ctaLabel="この名前で進む"
      disabled={isInvalid}
    >
      <View style={s.field}>
        <Text style={s.label}>ニックネーム</Text>
        <TextInput
          style={s.input}
          value={nickname}
          onChangeText={(v) => setField("nickname", v)}
          placeholder="例: ゆい"
          placeholderTextColor="rgba(255,255,255,0.4)"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="nickname"
          maxLength={20}
          returnKeyType="next"
          onSubmitEditing={goNext}
        />
      </View>
      <Text style={s.hint}>本名でなくて大丈夫です。通知や朝メモでだけ使います。</Text>
    </OnboardShell>
  );
}

const s = StyleSheet.create({
  field: { backgroundColor: C.white15, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: C.whiteBorder },
  label: { fontSize: 10, color: C.white, opacity: 0.8 },
  input: { fontSize: 18, color: C.white, marginTop: 6, fontFamily: F.serif, paddingVertical: 4 },
  hint: { color: C.white, fontSize: 11, opacity: 0.75, marginTop: 14, lineHeight: 20 },
});
