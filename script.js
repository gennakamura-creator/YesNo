<script>
  /**
   * フロー定義（レセスタ 導入前チェック）
   * type:
   *  - "question" : Yes / No で分岐
   *  - "outcome"  : 案内・注意・完了
   */
  const FLOW = {
    startId: "q1",
    nodes: {
      q1: {
        id: "q1",
        type: "question",
        text:
`レセスタの推奨環境のPCはありますか？
【推奨環境】
・最新OS
・電カル・レセコン同居不可
・その他 推奨環境に準拠`,
        yesTo: "q2",
        noTo: "m1_no"
      },

      m1_no: {
        id: "m1_no",
        type: "outcome",
        text:
`推奨環境のPCを用意して次にお進みください
（ご用意後、最初からやり直してください）`
      },

      q2: {
        id: "q2",
        type: "question",
        text:
`利用予定の端末はインターネットに接続されていますか？`,
        yesTo: "q3",
        noTo: "m2_no"
      },

      m2_no: {
        id: "m2_no",
        type: "outcome",
        text:
`インターネット環境を整えてください
（整ったら最初からやり直してください）`
      },

      q3: {
        id: "q3",
        type: "question",
        text:
`電子カルテ・レセコンと同居して使用しますか？`,
        yesTo: "m3_yes",
        noTo: "q4"
      },

      m3_yes: {
        id: "m3_yes",
        type: "outcome",
        text:
`同居利用の注意点
電カル：ホワイトリスト対応
レセコン：オンライン請求端末は推奨しておりません
別端末でのご利用を推奨しております
ご使用の場合は証明書の選択誤りにご注意ください`
      },

      q4: {
        id: "q4",
        type: "question",
        text:
`レセスタではメール登録が必要ですが、メールアドレスはありますか？
【注意】
・携帯キャリアのメールは不可です
・Yahoo / Google などは利用できます
【例】XXX@docomo… / xxx@ezweb…`,
        yesTo: "q5",
        noTo: "m4_no"
      },

      m4_no: {
        id: "m4_no",
        type: "outcome",
        text:
`携帯ではないメールアドレスを作成してください
（作成後、最初からやり直してください）`
      },

      q5: {
        id: "q5",
        type: "question",
        text:
`使用予定の端末でそのメールを確認できますか？`,
        yesTo: "q6",
        noTo: "m5_no"
      },

      m5_no: {
        id: "m5_no",
        type: "outcome",
        text:
`メール受信のお願い
レセスタより「タイトル」のメールが届きますので、
添付ファイルを解凍して使用する端末に移動してください。

可能であれば、レセスタを使用するPCで
メールを受信できるよう設定してください`
      },

      q6: {
        id: "q6",
        type: "outcome",
        text:
`お疲れ様でした（導入前チェック完了）`
      },

      q7: {
        id: "q7",
        type: "outcome",
        text:
`導入・運用開始のご案内
レセスタは縦覧点検に対応しています。
レセプト提出時の点検用データを
過去6ヶ月分程度ご準備ください。`
      }
    }
  };

  /**
   * outcome ノード表示後に「次へ」で進ませたい遷移
   */
  const OUTCOME_NEXT = {
    m3_yes: "q4",
    m5_no: "q6",
    q6: "q7"
  };

  // --------------------
  // アプリ本体ロジック
  // --------------------
  const $ = (id) => document.getElementById(id);

  const nodeIdEl  = $("nodeId");
  const qTitleEl  = $("qTitle");
  const qDetailEl = $("qDetail");
  const qNoteEl   = $("qNote");
  const errEl     = $("err");

  const yesBtn     = $("yesBtn");
  const noBtn      = $("noBtn");
  const nextBtn    = $("nextBtn");
  const restartBtn = $("restartBtn");
  const backBtn    = $("backBtn");

  const historyStack = [];
  let currentId = FLOW.startId;

  function getNode(id) {
    return FLOW.nodes[id] || null;
  }

  function splitText(text) {
    const lines = String(text || "").split("\n");
    const title = (lines.shift() || "").trim();
    const detail = lines.join("\n").trim();
    return { title, detail };
  }

  function setButtons(mode, hasNext) {
    if (mode === "question") {
      yesBtn.classList.remove("hidden");
      noBtn.classList.remove("hidden");
      nextBtn.classList.add("hidden");
      restartBtn.classList.add("hidden");
    } else {
      yesBtn.classList.add("hidden");
      noBtn.classList.add("hidden");
      if (hasNext) {
        nextBtn.classList.remove("hidden");
        restartBtn.classList.add("hidden");
      } else {
        nextBtn.classList.add("hidden");
        restartBtn.classList.remove("hidden");
      }
    }
  }

  function showNode(id, pushHistory = true) {
    const node = getNode(id);
    if (!node) {
      errEl.textContent = `ノードが見つかりません: ${id}`;
      return;
    }

    errEl.textContent = "";
    if (pushHistory && currentId) historyStack.push(currentId);
    currentId = id;

    nodeIdEl.textContent = id;

    const { title, detail } = splitText(node.text);
    qTitleEl.textContent = title || "（無題）";
    qDetailEl.textContent = detail;

    if (node.type === "question") {
      setButtons("question");
      qNoteEl.textContent = "下の Yes / No を選択してください。";
    } else {
      const next = OUTCOME_NEXT[id];
      setButtons("outcome", !!next);
      qNoteEl.textContent = next
        ? "内容を確認したら「次へ」で進んでください。"
        : "「最初から」で再実行できます。";
    }
  }

  function jump(id) {
    showNode(id, true);
  }

  // イベント
  yesBtn.addEventListener("click", () => {
    const n = getNode(currentId);
    if (n && n.type === "question") jump(n.yesTo);
  });

  noBtn.addEventListener("click", () => {
    const n = getNode(currentId);
    if (n && n.type === "question") jump(n.noTo);
  });

  nextBtn.addEventListener("click", () => {
    const next = OUTCOME_NEXT[currentId];
    if (next) jump(next);
  });

  restartBtn.addEventListener("click", () => {
    historyStack.length = 0;
    showNode(FLOW.startId, false);
  });

  backBtn.addEventListener("click", () => {
    const prev = historyStack.pop();
    if (prev) showNode(prev, false);
  });

  // 初期表示
  showNode(FLOW.startId, false);
</script>
