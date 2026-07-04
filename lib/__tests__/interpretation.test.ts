// AsyncStorage は公式 jest mock、supabase 依存はスタブ化
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);
jest.mock("../supabase", () => ({ fetchInterpretation: jest.fn() }));

import AsyncStorage from "@react-native-async-storage/async-storage";
import { pruneStaleInterpretationCache } from "../interpretation";

describe("pruneStaleInterpretationCache", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  test("旧バージョンの interp キーだけ削除し、現行版と他キーは残す", async () => {
    await AsyncStorage.setItem("interp:v2:甲子:乙丑", "old");
    await AsyncStorage.setItem("interp:v3:甲子:乙丑", "current");
    await AsyncStorage.setItem("asakizashi-user", "keep");

    await pruneStaleInterpretationCache();

    expect(await AsyncStorage.getItem("interp:v2:甲子:乙丑")).toBeNull();
    expect(await AsyncStorage.getItem("interp:v3:甲子:乙丑")).toBe("current");
    expect(await AsyncStorage.getItem("asakizashi-user")).toBe("keep");
  });

  test("2回目以降は実行済みフラグで走らない（毎起動 getAllKeys を避ける）", async () => {
    await AsyncStorage.setItem("interp:v3:x:y", "current");
    await pruneStaleInterpretationCache(); // フラグを立てる
    // フラグ後に旧キーを足しても、次回はスキップされ残る
    await AsyncStorage.setItem("interp:v1:old:key", "old");
    await pruneStaleInterpretationCache();
    expect(await AsyncStorage.getItem("interp:v1:old:key")).toBe("old");
  });
});
