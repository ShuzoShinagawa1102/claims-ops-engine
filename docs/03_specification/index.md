# 保険金請求・査定前後の実務 / 03_specification

    ## 1. ドメイン原則
    1. すべての案件は **Case / Aggregate** として追跡可能でなければならない
    2. どの判断も、**根拠ルール** と **根拠証拠** に接続されなければならない
    3. 自動化はブラックボックスではなく、**説明可能な提案** として実装する
    4. 例外は失敗ではなく、**明示的に管理される業務対象** とみなす
    5. 人間の最終責任を残しつつ、人が使う判断材料を機械側が準備する

    ## 2. 境界づけられたコンテキスト
    - **FNOL Intake**: First Notice of Loss 受付
- **Coverage Interpretation**: 約款・免責・特約解釈
- **Evidence Collection**: 写真、診断書、領収書、修理見積
- **Claim Assessment**: 支払可否と金額
- **Communication**: 追加照会・不足案内・結果説明
- **Appeal & Recovery**: 異議申立、求償、再審査


    ## 3. ユビキタス言語（最小）
    - **Case**: ひとつの業務要求を表す追跡単位
    - **Requirement**: 案件成立に必要な条件
    - **Evidence**: Requirement を満たす根拠資料
    - **Decision**: ルールと証拠に基づく判断結果
    - **Exception**: 標準フローから外れた状態
    - **Task**: 誰かに割り当てられた行為
    - **Audit Trail**: 後追いで再現可能な操作履歴

    ## 4. 主要ユースケース
    ### UC-01 案件起票
    入力チャネルから案件を生成し、最初の責任者を割り当てる。

    ### UC-02 必要条件の計算
    ルール・商品・国・相手先・契約種別などに応じて、必要書類・必要審査・期限を算出する。

    ### UC-03 証拠収集と完全性評価
    提出資料を受理し、欠落・期限切れ・不一致を検知する。

    ### UC-04 判断支援
    自動で結論を確定するのではなく、担当者に「推奨判断」「理由」「不足点」を提示する。

    ### UC-05 例外エスカレーション
    標準フローで処理できない場合に、例外案件へ昇格し、優先度と責任者を定める。

    ### UC-06 結果反映
    最終判断を下流システムへ反映し、後続業務へ接続する。

    ### UC-07 学習ループ
    完了案件から、将来のテンプレート、ルール、回答資産、リスクパターンを抽出する。

    ## 5. 集約と不変条件
    ### Aggregate: Case
    - Case は単一の状態遷移を持つ
    - Close された Case は、再審査または変更ケースを別生成しない限り再編集できない
    - Decision は Evidence 不足状態では確定できない
    - 例外理由が未設定のまま Exception 状態へ移行できない

    ### Aggregate: Requirement / Evidence
    - Evidence は Requirement に紐づかなければ意味を持たない
    - 有効期限切れの Evidence は自動的に「満たしている」とみなしてはならない

    ### Aggregate: Task
    - Task は明確な owner / due date / reason を持つ
    - SLA超過は監査イベントとして残す

    ## 6. ドメインイベント
    - CaseCreated
    - RequirementsCalculated
    - EvidenceReceived
    - EvidenceRejected
    - ExceptionRaised
    - TaskAssigned
    - DecisionRecommended
    - DecisionConfirmed
    - CaseClosed
    - CaseReopened
    - RuleSetChanged

    ## 7. ドメインモデル
    ```mermaid
    classDiagram
direction LR

class Policy {
  +policyId
  +productType
  +effectivePeriod
}
class ClaimCase {
  +claimId
  +lossDate
  +status
  +channel
}
class IncidentReport {
  +reportId
  +incidentType
  +narrative
}
class CoverageDecision {
  +decisionId
  +coverageOutcome
  +reason
}
class EvidenceItem {
  +evidenceId
  +evidenceType
  +status
}
class Assessment {
  +assessmentId
  +recommendedPayout
}
class AppealCase {
  +appealId
  +status
}

Policy "1" --> "*" ClaimCase : governs
ClaimCase "1" --> "1" IncidentReport : starts_with
ClaimCase "1" --> "*" EvidenceItem : supported_by
ClaimCase "1" --> "0..1" CoverageDecision : interpreted_as
ClaimCase "1" --> "0..1" Assessment : quantified_by
ClaimCase "1" --> "0..*" AppealCase : challenged_by
    ```

    ## 8. 状態遷移
    ```mermaid
    stateDiagram-v2
      [*] --> Draft
      Draft --> IntakeValidated
      IntakeValidated --> WaitingForEvidence
      WaitingForEvidence --> InReview
      InReview --> Exception
      InReview --> Approved
      InReview --> Rejected
      Exception --> WaitingForEvidence
      Exception --> InReview
      Approved --> Closed
      Rejected --> Closed
      Closed --> Reopened
    ```

    ## 9. コンテキスト間の関係
    ```mermaid
    flowchart LR
      A[Intake] --> B[Requirement Engine]
      B --> C[Evidence Management]
      C --> D[Decision Support]
      D --> E[Exception Orchestration]
      D --> F[Downstream Sync]
      E --> C
      F --> G[Audit & Analytics]
      C --> G
      D --> G
    ```

    ## 10. 実装上の注意
    - LLM は Case の owner ではなく、**assistant** として振る舞わせる
    - 重要判定は rule engine と structured extraction を混ぜる
    - 監査・再現性のない推論は本番の決定根拠に使わない
    - UI は「チャット」より「ケースボード」「不足点」「根拠表示」を優先する
