/* ================= 種目ライブラリ ================= */
/* type: reps=回数 / time=秒数（タイマーつき）
   cap: レベルが上がっても、これ以上は増やさない上限（未指定なら hard の1.6倍） */
const EX = {
  /* ====== ① ウォームアップ（動的に動かして温める。どれも1セット） ====== */
  armcircle: {
    name: "肩と腕まわし", fig: "armcircle", type: "time", phase: "warmup", int: 1,
    focus: [], area: ["shoulder", "back"], stress: [],
    amount: { easy: 40, hard: 60 }, sets: { easy: 1, hard: 1 }, cap: 90, setsCap: 1,
    tips: ["前まわしと後ろまわしを半分ずつ", "ひじで大きな円を描く", "肩の力は抜いたまま"],
    ng: "首をすくめて回す", adjust: "座ったままでもできます。",
  },
  hipcircle: {
    name: "股関節まわし", fig: "hipcircle", type: "time", phase: "warmup", int: 1,
    focus: [], area: ["hip", "posture"], stress: [],
    amount: { easy: 40, hard: 60 }, sets: { easy: 1, hard: 1 }, cap: 90, setsCap: 1,
    tips: ["足を肩幅に開き、手は腰に", "腰でゆっくり大きな円を描く", "右まわり・左まわりを半分ずつ", "上半身はできるだけ動かさない"],
    ng: "ひざだけで回す", adjust: "痛みが出ない範囲で、小さく回して構いません。",
  },
  sidebend: {
    name: "体側のばし", fig: "sidebend", type: "time", phase: "warmup", int: 1,
    focus: [], area: ["waist", "posture"], stress: [],
    amount: { easy: 40, hard: 60 }, sets: { easy: 1, hard: 1 }, cap: 90, setsCap: 1,
    tips: ["片手を上に伸ばし、体をゆっくり横に倒す", "反対側のわき腹が伸びるのを感じる", "左右を交互に"],
    ng: "前かがみになりながら倒す", adjust: "倒す角度は浅くて構いません。",
  },
  warmmarch: {
    name: "軽く足踏み（静音）", fig: "march", type: "time", phase: "warmup", int: 1,
    focus: [], area: ["calf", "thighF"], stress: [],
    amount: { easy: 60, hard: 90 }, sets: { easy: 1, hard: 1 }, cap: 120, setsCap: 1,
    tips: ["つま先から静かに下ろす", "ももは腰の高さの半分まで", "腕も軽く振る"],
    ng: "はじめから全力で動く", adjust: "その場で足踏みせず、歩き回るだけでも構いません。",
  },

  /* ====== ② メイン：下半身 ====== */
  squat: {
    name: "スクワット", fig: "squat", type: "reps", phase: "main", int: 2,
    focus: ["lower"], area: ["thighF", "hip", "inner"], stress: ["knee"],
    amount: { easy: 10, hard: 15 }, sets: { easy: 2, hard: 3 },
    tips: ["足は肩幅、つま先は少し外向き", "いすに座るように、おしりを後ろへ引く", "ひざがつま先より前に出すぎないところで止める", "上げるときは3秒、下ろすときも3秒"],
    ng: "かかとが浮く／背中が丸まる", adjust: "つらければ、いすに軽く触れるところまでで十分です。",
  },
  hinge: {
    name: "ヒップヒンジ", fig: "hinge", type: "reps", phase: "main", int: 2,
    focus: ["lower"], area: ["thighB", "hip", "back"], stress: ["back"],
    amount: { easy: 10, hard: 14 }, sets: { easy: 2, hard: 3 },
    tips: ["足は腰幅、ひざは軽くゆるめる", "背中はまっすぐのまま、おしりを後ろへ引く", "もも裏が突っ張るところで止める", "おしりの力で起き上がる"],
    ng: "背中を丸めて前に倒れる", adjust: "壁を背にして立ち、おしりが壁に触れる範囲で動くと形が作りやすいです。",
  },
  wallsit: {
    name: "ウォールシット", fig: "wallsit", type: "time", phase: "main", int: 2,
    focus: ["lower"], area: ["thighF", "hip"], stress: ["knee"],
    amount: { easy: 20, hard: 40 }, sets: { easy: 2, hard: 3 }, cap: 60,
    tips: ["壁に背中をつけ、ひざを90度に曲げて止まる", "ひざがつま先より前に出ない位置まで足を前へ", "呼吸は止めず、数えながら"],
    ng: "腰が壁から浮く", adjust: "角度を浅く（ひざを120度くらいに）すれば楽になります。",
  },
  hip: {
    name: "ヒップリフト", fig: "hip", type: "reps", phase: "main", int: 1,
    focus: ["lower", "core"], area: ["hip", "thighB", "bellyLow"], stress: [],
    amount: { easy: 12, hard: 15 }, sets: { easy: 2, hard: 3 },
    tips: ["仰向け、ひざを立てて足はこぶし1個ぶん開く", "おしりに力を入れて持ち上げ、上で1秒止める", "肩からひざが一直線になる高さまで", "下ろすときは床につく直前で止めて連続で"],
    ng: "腰を反らせて上げる", adjust: "腰が痛むときは高さを半分に。",
  },
  lunge: {
    name: "フロントランジ", fig: "lunge", type: "reps", phase: "main", int: 2,
    focus: ["lower"], area: ["thighF", "thighB", "hip"], stress: ["knee"],
    amount: { easy: 8, hard: 12 }, sets: { easy: 2, hard: 2 }, perSide: true,
    tips: ["片足を大きく前に出し、真下に沈む", "上体は前に倒さずまっすぐ", "後ろのひざは床につく直前まで", "ふらつくなら壁に手を添えて"],
    ng: "前に踏み込みすぎてひざが前に出る", adjust: "歩幅を狭く、沈む深さを浅くしてください。",
  },
  calf: {
    name: "カーフレイズ", fig: "calf", type: "reps", phase: "main", int: 1,
    focus: ["lower"], area: ["calf"], stress: [],
    amount: { easy: 15, hard: 20 }, sets: { easy: 2, hard: 3 },
    tips: ["まっすぐ立って、かかとを上げきる", "上でいったん止める", "下ろすのは2秒かけてゆっくり"],
    ng: "反動で跳ねる", adjust: "壁に手をついてバランスを取ってOK。",
  },
  sideleg: {
    name: "サイドレッグレイズ", fig: "sideleg", type: "reps", phase: "main", int: 1,
    focus: ["lower"], area: ["hip", "inner", "waist"], stress: [],
    amount: { easy: 12, hard: 16 }, sets: { easy: 2, hard: 3 }, perSide: true,
    tips: ["横向きに寝て、体は一直線", "上の脚をつま先を少し下に向けたまま上げる", "上げるのは45度くらいまで", "おしりの横に効いていればOK"],
    ng: "体が後ろに倒れる", adjust: "壁を背にして行うと姿勢が安定します。",
  },

  /* ====== ② メイン：体幹（安定させる種目を先に、腰に負担のあるものは控えめに） ====== */
  plank: {
    name: "プランク", fig: "plank", type: "time", phase: "main", int: 2,
    focus: ["core"], area: ["bellyUp", "posture"], stress: ["wrist", "shoulder"],
    amount: { easy: 20, hard: 40 }, sets: { easy: 2, hard: 3 }, cap: 60,
    tips: ["ひじは肩の真下", "頭・背中・かかとが一直線", "おへそを軽く引き込む", "呼吸は止めない"],
    ng: "腰が落ちる／おしりが高い", adjust: "ひざをついた状態から始めてください。",
  },
  birddog: {
    name: "バードドッグ", fig: "birddog", type: "reps", phase: "main", int: 1,
    focus: ["core"], area: ["posture", "back", "bellyLow"], stress: [],
    amount: { easy: 8, hard: 12 }, sets: { easy: 2, hard: 3 }, perSide: true,
    tips: ["四つんばいで手は肩の真下、ひざは腰の真下", "対角の手と足をゆっくり伸ばす", "伸ばしたところで2秒止める", "背中は床と平行のまま"],
    ng: "腰が反る／体が左右に傾く", adjust: "手だけ、足だけの動きから始めてOK。",
  },
  deadbug: {
    name: "デッドバグ", fig: "deadbug", type: "reps", phase: "main", int: 1,
    focus: ["core"], area: ["bellyLow", "posture"], stress: [],
    amount: { easy: 8, hard: 12 }, sets: { easy: 2, hard: 3 }, perSide: true,
    tips: ["仰向けで手と脚を天井に上げる", "対角の手と脚をゆっくり伸ばす", "腰は床につけたまま動かさない"],
    ng: "腰が浮く", adjust: "腕だけ、脚だけの動きから始めてOK。",
  },
  sideplank: {
    name: "サイドプランク", fig: "sideplank", type: "time", phase: "main", int: 2,
    focus: ["core"], area: ["waist", "bellyUp"], stress: ["shoulder"],
    amount: { easy: 15, hard: 30 }, sets: { easy: 2, hard: 2 }, perSide: true, cap: 45,
    tips: ["ひじは肩の真下", "体を一直線にして腰を持ち上げる", "下の脇腹で支える意識"],
    ng: "体が前後にねじれる", adjust: "ひざをついて行えば負荷が半分ほどになります。",
  },
  legraise: {
    name: "レッグレイズ", fig: "legraise", type: "reps", phase: "main", int: 2, spineLoad: true,
    focus: ["core"], area: ["bellyLow"], stress: ["back"],
    amount: { easy: 10, hard: 15 }, sets: { easy: 2, hard: 3 },
    tips: ["仰向けで手はおしりの下に", "脚をそろえて上げ、床の直前で止める", "腰を床から浮かせない"],
    ng: "腰が浮いて反る", adjust: "ひざを曲げたままで大丈夫です。",
  },
  twist: {
    name: "ツイストクランチ", fig: "twist", type: "reps", phase: "main", int: 2, spineLoad: true,
    focus: ["core"], area: ["waist", "bellyUp"], stress: ["back"],
    amount: { easy: 8, hard: 12 }, sets: { easy: 2, hard: 3 }, perSide: true,
    tips: ["ひざを立てて仰向け", "ひじを反対のひざへ近づける", "おへそをのぞき込むイメージ"],
    ng: "首を手で引っぱる", adjust: "手は耳に軽く触れる程度にしてください。",
  },

  climber: {
    name: "マウンテンクライマー", fig: "climber", type: "time", phase: "main", int: 3,
    focus: ["core"], area: ["bellyUp", "bellyLow", "posture"], stress: ["wrist", "shoulder"],
    amount: { easy: 20, hard: 30 }, sets: { easy: 3, hard: 4 }, cap: 45,
    tips: ["手は肩の真下、体は一直線", "ひざを胸に向けて交互に引きつける", "おしりが上下しないように"],
    ng: "腰が反る／おしりが上がる", adjust: "速さより姿勢優先。ゆっくりで構いません。",
  },
  burpee: {
    name: "スローバーピー", fig: "burpee", type: "reps", phase: "main", int: 3, noisy: true,
    focus: ["lower"], area: ["bellyLow", "thighF"], stress: ["knee", "wrist"],
    amount: { easy: 5, hard: 8 }, sets: { easy: 2, hard: 3 },
    tips: ["しゃがむ→手を床に→脚を後ろへ→戻る→立つ", "ジャンプはしない", "1回ずつ丁寧に"],
    ng: "勢いで腰を落とす", adjust: "脚は後ろに伸ばさず、その場しゃがみ立ちだけでも効果があります。",
  },

  /* ====== ② メイン：上半身・背中 ====== */
  scap: {
    name: "肩甲骨寄せ", fig: "scap", type: "reps", phase: "main", int: 1,
    focus: ["upper"], area: ["back", "shoulder", "posture"], stress: [],
    amount: { easy: 15, hard: 20 }, sets: { easy: 2, hard: 3 },
    tips: ["ひじを曲げて肩の高さに", "肩を下げたまま背中の真ん中を寄せる", "1回ごとに2秒キープ"],
    ng: "肩がすくむ", adjust: "座ったままでもできます。",
  },
  towelrow: {
    name: "タオルローイング", fig: "row", type: "reps", phase: "main", int: 1,
    focus: ["upper"], area: ["back", "arms", "shoulder"], stress: [],
    amount: { easy: 12, hard: 16 }, sets: { easy: 2, hard: 3 },
    tips: ["タオルの両端を持って前に伸ばす", "外側へ引っぱる力をかけたまま、ひじを後ろへ引く", "肩甲骨を寄せて2秒キープ", "肩は下げたまま"],
    ng: "肩がすくむ／背中が丸まる", adjust: "引っぱる力を弱めれば軽くなります。座ったままでもOK。",
  },
  wallangel: {
    name: "壁に沿って腕上げ", fig: "wallangel", type: "reps", phase: "main", int: 1,
    focus: ["upper"], area: ["shoulder", "back", "posture"], stress: ["shoulder"],
    amount: { easy: 10, hard: 14 }, sets: { easy: 2, hard: 3 },
    tips: ["背中と後頭部を壁につけて立つ", "ひじと手の甲も壁につけたまま上下させる", "腰は壁から離しすぎない", "壁から浮かない範囲でOK"],
    ng: "腰を反らせて腕を上げる", adjust: "手が壁から浮くところで止めて大丈夫です。",
  },
  wallpush: {
    name: "壁プッシュアップ", fig: "wallpush", type: "reps", phase: "main", int: 1,
    focus: ["upper"], area: ["arms", "shoulder"], stress: ["shoulder"],
    amount: { easy: 12, hard: 15 }, sets: { easy: 2, hard: 3 },
    tips: ["壁に手をつき、足を後ろへ下げる", "体を一直線に保ったままひじを曲げる", "胸を壁に近づける"],
    ng: "腰だけが先に近づく", adjust: "足を壁に近づけるほど軽くなります。",
  },
  pushup: {
    name: "ひざつき腕立て", fig: "pushup", type: "reps", phase: "main", int: 2,
    focus: ["upper"], area: ["arms", "shoulder"], stress: ["wrist", "shoulder"],
    amount: { easy: 5, hard: 10 }, sets: { easy: 2, hard: 3 },
    tips: ["ひざをついて、手は肩幅より少し広く", "頭からひざまで一直線", "胸を床に近づける"],
    ng: "おしりが上がる", adjust: "手首が痛むならこぶしを握って行ってください。",
  },
  fullpush: {
    name: "腕立て伏せ", fig: "pushup", type: "reps", phase: "main", int: 3,
    focus: ["upper"], area: ["arms", "shoulder", "bellyUp"], stress: ["wrist", "shoulder"],
    amount: { easy: 5, hard: 10 }, sets: { easy: 2, hard: 3 },
    tips: ["手は肩幅より少し広く、足はつま先で支える", "頭からかかとまで一直線", "胸を床に近づけ、ひじは体から45度くらい"],
    ng: "腰が落ちる／おしりが上がる", adjust: "きつければ、ひざつき腕立てに戻して構いません。",
  },
  backext: {
    name: "バックエクステンション", fig: "backext", type: "reps", phase: "main", int: 2, spineLoad: true,
    focus: ["upper"], area: ["back", "posture"], stress: ["back"],
    amount: { easy: 10, hard: 15 }, sets: { easy: 2, hard: 3 },
    tips: ["うつ伏せで手は頭の横", "上体を軽く起こす", "反らせすぎない（10cmで十分）"],
    ng: "限界まで反る", adjust: "腰に違和感が出たらすぐ中止してください。",
  },

  /* ====== ③ 有酸素（毎日20分。2種目 × 各10分ぶん。block × blockSets = 600秒） ====== */
  march: {
    name: "もも上げ（足踏み）", fig: "march", type: "time", phase: "cardio", int: 2, noisy: true,
    focus: ["cardio"], area: ["bellyLow", "thighF", "calf"], stress: [],
    block: 120, blockSets: 5, amount: { easy: 120, hard: 120 }, sets: { easy: 5, hard: 5 },
    tips: ["背筋を伸ばして立つ", "太ももが床と平行になるくらいまで高く、交互に上げる", "腕もしっかり振ると心拍数が上がる", "2分ごとに休憩をはさむ"],
    ng: "足が上がらず前かがみになる", adjust: "高さを半分にして、続ける時間を優先してください。",
  },
  stepup: {
    name: "踏み台昇降", fig: "stepup", type: "time", phase: "cardio", int: 2, noisy: true,
    focus: ["cardio"], area: ["thighF", "hip", "calf"], stress: ["knee"],
    block: 300, blockSets: 2, amount: { easy: 300, hard: 300 }, sets: { easy: 2, hard: 2 },
    tips: ["家の段差や、雑誌を束ねた台を使う", "無理のないテンポで上り下りをくり返す", "右足→左足の順に上り、同じ順で下りる", "途中で上る足を入れ替える"],
    ng: "台が高すぎる／踏み外す", adjust: "台がなければ、その場の足踏みに替えて構いません。",
  },
  slowsquat: {
    name: "スロースクワット", fig: "squat", type: "reps", phase: "cardio", int: 1,
    focus: ["cardio"], area: ["thighF", "hip", "inner"], stress: ["knee"],
    block: 20, blockSets: 3, amount: { easy: 20, hard: 20 }, sets: { easy: 3, hard: 3 },
    tips: ["5秒かけてゆっくり下げ、5秒かけてゆっくり上げる", "1回に10秒かける（20回で約3分半）", "負荷は低いので、大きい下半身の筋肉を有酸素として使える", "ひざがつま先より前に出すぎないところで止める"],
    ng: "反動をつけて速く動かす", adjust: "深さは浅くて構いません。いすに軽く触れながらでもOK。",
  },
  aircycle: {
    name: "エア自転車こぎ", fig: "legraise", type: "time", phase: "cardio", int: 1,
    focus: ["cardio"], area: ["bellyLow", "thighF"], stress: [],
    block: 200, blockSets: 3, amount: { easy: 200, hard: 200 }, sets: { easy: 3, hard: 3 },
    tips: ["仰向けになり、足を空中に上げる", "自転車をこぐように交互に動かす", "腰は床につけたまま", "床の振動が出ないので、集合住宅でもできる"],
    ng: "腰が浮いて反る", adjust: "手をおしりの下に入れると腰が安定します。",
  },
  easystep: {
    name: "ゆっくり足踏み（静音）", fig: "march", type: "time", phase: "cardio", int: 1,
    focus: ["cardio"], area: ["calf", "thighF"], stress: [],
    block: 300, blockSets: 2, amount: { easy: 300, hard: 300 }, sets: { easy: 2, hard: 2 },
    tips: ["ももは上げすぎず、腰の高さの半分くらいまで", "つま先から静かに下ろす", "会話ができるくらいのペースで"],
    ng: "息が上がるほど速くする", adjust: "その場で足踏みせず、歩き回るだけでも構いません。",
  },
  step: {
    name: "スローステップ（静音）", fig: "walk", type: "time", phase: "cardio", int: 2,
    focus: ["cardio"], area: ["calf", "thighF"], stress: [],
    block: 200, blockSets: 3, amount: { easy: 200, hard: 200 }, sets: { easy: 3, hard: 3 },
    tips: ["つま先から静かに着地する", "かかとは床につけない", "テンポは一定に、止まらない"],
    ng: "どすんと着地する", adjust: "タオルやマットの上で行うとさらに静かです。",
  },
  walk: {
    name: "ゆっくり歩く", fig: "walk", type: "time", phase: "cardio", int: 1,
    focus: ["cardio"], area: ["calf"], stress: [],
    block: 600, blockSets: 1, amount: { easy: 600, hard: 600 }, sets: { easy: 1, hard: 1 },
    tips: ["歩幅はいつもより少し大きく", "スマホは見ずに前を見る", "音楽を聴きながらで十分"],
    ng: "スマホを見ながら猫背で歩く", adjust: "外に出られない日は、家の中を歩き回るだけでも代わりになります。",
  },

  /* ====== ④ クールダウン（呼吸を整えて伸ばす。どれも1セット） ====== */
  stretch: {
    name: "全身ストレッチ", fig: "stretch", type: "time", phase: "cooldown", int: 1,
    focus: [], area: [], stress: [],
    amount: { easy: 120, hard: 180 }, sets: { easy: 1, hard: 1 }, cap: 240, setsCap: 1,
    tips: ["痛気持ちいいところで20秒キープ", "反動はつけない", "息を吐きながら伸ばす"],
    ng: "痛みが出るまで伸ばす", adjust: "お風呂上がりが最も伸びやすい時間です。",
  },
  hipstretch: {
    name: "股関節のストレッチ", fig: "hipstretch", type: "time", phase: "cooldown", int: 1,
    focus: [], area: ["hip", "inner", "posture"], stress: [],
    amount: { easy: 60, hard: 90 }, sets: { easy: 1, hard: 1 }, cap: 120, setsCap: 1,
    tips: ["床に座って足の裏どうしを合わせる", "背中を伸ばしたまま、ひざを外へ開く", "息を吐きながら20秒キープ"],
    ng: "反動をつけてひざを押す", adjust: "壁に背中をつけて座ると楽になります。",
  },
  hamstretch: {
    name: "もも裏のばし", fig: "hamstretch", type: "time", phase: "cooldown", int: 1,
    focus: [], area: ["thighB", "calf"], stress: [],
    amount: { easy: 60, hard: 90 }, sets: { easy: 1, hard: 1 }, cap: 120, setsCap: 1,
    tips: ["床に座り、片脚を前に伸ばす", "背中を伸ばしたまま股関節から前に倒す", "痛気持ちいいところで20秒", "左右を同じ時間ずつ"],
    ng: "背中を丸めて頭だけ近づける", adjust: "ひざは軽く曲げたままで構いません。",
  },
  chestopen: {
    name: "胸ひらき", fig: "chestopen", type: "time", phase: "cooldown", int: 1,
    focus: [], area: ["shoulder", "back", "posture"], stress: ["shoulder"],
    amount: { easy: 45, hard: 60 }, sets: { easy: 1, hard: 1 }, cap: 90, setsCap: 1,
    tips: ["両手を体の後ろで組む", "胸を開いて肩甲骨を寄せる", "あごは軽く引いたまま20秒"],
    ng: "あごが上がって首が反る", adjust: "手が組めなければ、タオルの両端を持ってください。",
  },
  catcow: {
    name: "背中まるめ・そらし", fig: "catcow", type: "time", phase: "cooldown", int: 1,
    focus: [], area: ["back", "posture"], stress: ["wrist"],
    amount: { easy: 60, hard: 90 }, sets: { easy: 1, hard: 1 }, cap: 120, setsCap: 1,
    tips: ["四つんばいで手は肩の真下、ひざは腰の真下", "息を吐きながら背中を丸める", "息を吸いながらゆっくり反らす", "1往復に4秒くらいかけて"],
    ng: "首だけを動かす", adjust: "手首がつらいときは、いすに座って背中だけ動かしてもOK。",
  },
};

/* ③ 有酸素は毎日20分。2種目に分け、1種目あたり10分（600秒）ぶんを割り当てる。
   有酸素だけはレベルや段階で長さを変えない（20分と決めたら20分） */
const CARDIO_TOTAL_SEC = 1200;
const CARDIO_PICKS = 2;
/* この2つはどこからも参照されていない（有酸素種目の amount に 600 が直接書いてある）。
   数字の出どころを示す資料として残してあるが、種目側の値とずれると誰も気づけない。
   Phase 4 で「amount を この定数から出す」か「削る」かを決めること。 */
// eslint-disable-next-line no-unused-vars
const CARDIO_SHARE_SEC = CARDIO_TOTAL_SEC / CARDIO_PICKS;

/* 1回の流れ。ウォームアップとクールダウンは時間が短い日でも削らない */
const PHASE_ORDER = ["warmup", "main", "cardio", "cooldown"];
const PHASE_META = {
  warmup: { label: "① ウォームアップ", note: "体を温めます。設定した時間には含みません。飛ばさないでください。" },
  main: { label: "② メイン", note: "今日の対象を鍛えます。設定した時間はここのぶんです。" },
  cardio: { label: "③ 有酸素", note: "毎日20分。筋トレのあとに行うと脂肪が燃えやすくなります。" },
  cooldown: { label: "④ クールダウン", note: "使った筋肉を伸ばします。設定した時間には含みません。" },
};
const phaseOf = (id) => EX[id]?.phase ?? "main";
/* 強度の上限。3（マウンテンクライマー・スローバーピー・通常の腕立て）は
   「ふつう」以上を選んだ人にだけ出す */
const maxIntensity = (lv) => (lv >= 2 ? 3 : 2);

const FOCUS_META = {
  lower: { label: "下半身の日", emoji: "🍑", tone: "大きい筋肉から。ゆっくり動くほど効きます。" },
  core: { label: "おなか・体幹の日", emoji: "🌸", tone: "姿勢を保つことが目的です。呼吸を止めずに。" },
  upper: { label: "上半身・背中の日", emoji: "🕊", tone: "姿勢が変わると見た目の印象も変わります。" },
  cardio: { label: "有酸素の日", emoji: "🎀", tone: "筋トレは軽めにして、有酸素を中心にする日です。" },
  full: { label: "全身の日", emoji: "⭐️", tone: "続けて1周。休むのはセット間だけです。" },
  rest: { label: "ととのえる日", emoji: "🍃", tone: "筋トレはお休み。軽い有酸素20分とストレッチだけの日です。回復も練習のうちです。" },
};

export { CARDIO_PICKS, EX, FOCUS_META, PHASE_META, PHASE_ORDER, maxIntensity, phaseOf };
