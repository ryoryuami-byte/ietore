/* 設定の定義。
   ここを1か所にまとめたことで、初期値・検証・画面がずれなくなった。
   そのずれが起きていないことを、ここで見張る。 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";
import { defaults, groupsOf, isEnabled, normalizeSettings, SETTINGS } from "./settings.js";
import { normalizeCore } from "./logic/validate.js";
import { DEFAULT_CORE } from "./storage.js";
import { REST_SEC } from "./utils.js";

describe("設定の定義", () => {
  it("id が重複していない", () => {
    const ids = SETTINGS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("choice の初期値は、必ず選択肢の中にある", () => {
    for (const s of SETTINGS.filter((x) => x.type === "choice")) {
      expect(s.options.map(([v]) => v), s.id).toContain(s.def);
    }
  });

  it("dependsOn の相手が実在する", () => {
    const ids = new Set(SETTINGS.map((s) => s.id));
    for (const s of SETTINGS.filter((x) => x.dependsOn)) {
      expect(ids.has(s.dependsOn), `${s.id} → ${s.dependsOn}`).toBe(true);
    }
  });

  it("休憩の初期値が utils の REST_SEC と一致している", () => {
    /* 片方だけ変えると、初回だけ違う長さになる */
    expect(defaults().restSec).toBe(REST_SEC);
  });

  it("DEFAULT_CORE に、すべての設定が入っている", () => {
    for (const s of SETTINGS) expect(DEFAULT_CORE, s.id).toHaveProperty(s.id);
  });
});

describe("normalizeSettings", () => {
  it("何も渡さなければ初期値になる", () => {
    expect(normalizeSettings({})).toEqual(defaults());
    expect(normalizeSettings(null)).toEqual(defaults());
    expect(normalizeSettings("x")).toEqual(defaults());
  });

  it("オン・オフは、はっきり false のときだけ切る", () => {
    expect(normalizeSettings({ voiceOn: false }).voiceOn).toBe(false);
    expect(normalizeSettings({ voiceOn: true }).voiceOn).toBe(true);
    /* 知らない値でオフにしない（保存が壊れて全部切れるのを防ぐ） */
    expect(normalizeSettings({ voiceOn: "no" }).voiceOn).toBe(true);
    expect(normalizeSettings({ voiceOn: undefined }).voiceOn).toBe(true);
  });

  it("選択肢は、実在する値だけを通す", () => {
    expect(normalizeSettings({ voiceRate: "fast" }).voiceRate).toBe("fast");
    expect(normalizeSettings({ voiceRate: "ばく速" }).voiceRate).toBe("normal");
    expect(normalizeSettings({ tempoSec: "4" }).tempoSec).toBe("4");
    expect(normalizeSettings({ tempoSec: 99 }).tempoSec).toBe("3");
  });

  it("数と文字列の取り違えを吸収する", () => {
    /* 引き継ぎの JSON では 30 が "30" になっていることがある */
    expect(normalizeSettings({ restSec: "45" }).restSec).toBe(45);
    expect(normalizeSettings({ restSec: 45 }).restSec).toBe(45);
  });

  it("時刻は形が合っているときだけ通す", () => {
    expect(normalizeSettings({ notifyTime: "07:30" }).notifyTime).toBe("07:30");
    expect(normalizeSettings({ notifyTime: "7時" }).notifyTime).toBe("20:00");
  });
});

describe("画面の組み立て", () => {
  it("group を指定すると、その並びだけ返る", () => {
    const [g] = groupsOf(["coach"]);
    expect(g.id).toBe("coach");
    expect(g.items.map((i) => i.id)).toEqual(
      ["voiceOn", "voiceRate", "countdownOn", "repCountOn", "tempoOn", "tempoSec"]
    );
  });

  it("group が無い設定は画面に出さない", () => {
    const shown = groupsOf(null).flatMap((g) => g.items.map((i) => i.id));
    expect(shown).not.toContain("notifyAsked");
  });

  it("親がオフなら、ぶら下がる設定は触れない", () => {
    const rate = SETTINGS.find((s) => s.id === "voiceRate");
    expect(isEnabled(rate, { voiceOn: true })).toBe(true);
    expect(isEnabled(rate, { voiceOn: false })).toBe(false);
    /* 親を持たない設定は、いつでも触れる */
    expect(isEnabled(SETTINGS.find((s) => s.id === "voiceOn"), {})).toBe(true);
  });
});

describe("画面に出ているか", () => {
  /* v18.4 で実際にやらかした取りこぼし。
     settings.js に足しただけで満足すると、初期値も検証も付いてくるぶん
     「保存はされるのに、誰も触れない設定」が静かにできあがる。
     設定画面の中身そのものを読んで、取りこぼしをその場で落とす。 */
  /* import.meta.url は jsdom だと http: になるので、実行場所からたどる */
  const src = readFileSync(resolve(process.cwd(), "src/screens/Settings.jsx"), "utf8");

  it("group を持つ設定は、必ず設定画面から届く", () => {
    /* <SettingGroup id="coach" /> のように、まとめて描いているグループ */
    const auto = new Set([...src.matchAll(/<SettingGroup[^>]*\bid="([^"]+)"/g)].map((m) => m[1]));

    for (const s of SETTINGS) {
      if (!s.group) continue;
      /* まとめて描かれているか、手で書かれて id が出てきているか */
      const shown = auto.has(s.group) || src.includes(s.id);
      expect(shown, `${s.id}（${s.label}）が設定画面に出ていない`).toBe(true);
    }
  });
});

describe("読み込みとの繋がり", () => {
  it("v17.2 の保存に、新しい設定が初期値で足される", () => {
    const c = normalizeCore({ name: "テスト", notifyTime: "07:00" });
    expect(c.voiceOn).toBe(true);
    expect(c.tempoSec).toBe("3");
    expect(c.notifyTime).toBe("07:00"); /* もとの値は残る */
  });

  it("設定を切った状態が、読み込み後も残る", () => {
    const c = normalizeCore({ voiceOn: false, tempoOn: false, voiceRate: "slow" });
    expect(c.voiceOn).toBe(false);
    expect(c.tempoOn).toBe(false);
    expect(c.voiceRate).toBe("slow");
  });
});
