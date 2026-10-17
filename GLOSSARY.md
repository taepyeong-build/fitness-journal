# Personal Health Repository

데이터와 생체리듬을 기반으로 개인의 현재 상태(`Profile`), 과학적·설계적 근거(`Research`), 그리고 시공간적 메조사이클 및 실험 실행(`Project`)을 통합 운영하는 적응형 대사 회복·신체 재구성 도메인입니다.

## Language

### 1. Core Repository Pillars

**Profile**:
나에 대한 기준선(Baseline)이자 현재 활성 상태의 총합. 고유 특성 및 지향점(`overview.md`), 현재 각 트랙의 활성 레벨(`Lv`)과 일상에서 상시 유지 중인 운영 체계(`Protocol`), 3주기 핵심 생체·퍼포먼스 지표 추이표(`measurements.md`), 그리고 특정 시점의 정밀 측정 원본인 날짜별 `Snapshot`을 포함한다.
_Avoid_: User info, Bio, Settings

**Protocol**:
검증을 거쳐 현재 일상에서 상시 유지하기로 채택한 기본 생활 체계 및 현재 활성 레벨(`Lv`) 상태(24시간 일주기 앵커, 주간 운동 운영 모드, 기본 식단 원칙, 4슬롯 상시 복용 서플리먼트 등). 성공적인 `Project`의 결과물과 달성된 레벨이 `Profile`로 승격되어 자리 잡는다.
_Avoid_: Routine, Habit, Rule

**Snapshot**:
종합건강검진, 정밀 혈액검사, 혹은 특정 `Project`(메조사이클) 전후의 정밀 측정처럼 단일 요약표에 모두 담기 어려운 특정 일자(`YYYY-MM-DD`)의 상세 생체 데이터 및 몸 상태 기록.
_Avoid_: Log, Backup, History

**Research**:
건강 개선 가설을 세우거나 도메인별 운영 아키텍처를 설계하기 위해 수집·정리한 영구 지식 단위. 학술적·생리학적 메커니즘뿐만 아니라 이를 내 상황(`Profile`)에 적용하기 위한 단계별 스케일링 매트릭스(`Lv`), 모듈 카탈로그(`Session`/`Meal`/`Recovery Module`), `Progression Gate`, `Readiness Traffic Light` 설계를 포함한다.
_Avoid_: Study, Wiki, Reference, Note

**Project**:
정해진 기간(예: 4주/8주 메조사이클 또는 특정 병목 해결 기간) 동안 명확한 목표 레벨(`Lv`) 승급이나 건강 가설을 세우고, 주간 실행 계획, 일일/주간 생체 반응 로그(`log.md`), 그리고 종료 후 `Progression Gate` 판정 및 회고를 기록하는 시공간적 실행 단위.
_Avoid_: Experiment, Challenge, Sprint, Campaign

### 2. Adaptive Execution & Autoregulation Units

**Session Module**:
가용 시간과 당일 컨디션(`Readiness Traffic Light`)에 맞춰 선택·조합하여 수행하는 단일 운동(칼리스데닉스·러닝) 세션의 설계 단위(예: 10분 대사 방어 익스프레스, 30분 주력 기본기, 60분 주말 확장 등). 상시 채택된 주간 생활 체계인 `Protocol`과 구별된다.
_Avoid_: Workout Routine, Daily Program

**Meal Module**:
조리 가용 시간, 식사 장소(홈쿡·오피스 외식·편의점·회식), 당일 훈련 일정(메타볼릭 데이 vs 휴식일)에 맞춰 끼니 또는 일일 단위로 선택·조합하는 영양 및 식사 설계 단위(예: 5분 대사 점화 쉐이크, 15분 1플레이트 홈쿡, 외식/회식 디펜스 등). 상시 채택된 기본 식단 원칙인 `Protocol`과 구별된다.
_Avoid_: Diet Plan, Menu, Recipe, Meal Routine

**Recovery Module**:
당일 신경계 각성도(야근·스트레스), 누적 신체 피로도, 가용 시간에 맞춰 취침 전 또는 낮 시간대에 선택·조합하여 수행하는 수면 유도 및 신경·대사 회복 설계 단위(예: 10분 긴급 뇌파 셧다운, 30분 표준 윈드다운, 20분 오피스 파워 리셋냅, 60분 프리미엄 슬립 생츄어리 등). 상시 채택된 기본 수면 원칙인 `Protocol`과 구별된다.
_Avoid_: Sleep Routine, Relaxation Habit, Night Program

**Progression Gate**:
주관적 의지나 단순 경과 기간이 아니라, 수행 능력(볼륨·RIR·심박 드리프트), 생체 안전성(24~48시간 무통증 NRS 0~1·야간 SpO2), 습관 준수율(최근 14일 중 12일 `≥85%`), 최소 조직 적응 체류 기간(2~4주)을 모두 충족해야만 다음 단계(`Lv 0~4`)로 승급을 허용하는 다중 객관적 관문 규칙.
_Avoid_: Level Up Rule, Milestone, Promotion Criteria

**Readiness Traffic Light**:
매일 아침의 생체 지표(스마트워치 수면 시간·수면 효율·야간 RHR·HRV·SpO2, 아침 첫발 관절 통증 NRS, 대사·식욕 피로 신호)를 바탕으로 당일 상태를 `🟢 Green`(표준 실행 및 점진적 과부하), `🟡 Yellow`(볼륨 감축·모듈 다운시프트·탄수화물/수면 보강), `🔴 Red`(고강도/충격 중단·유지 칼로리 방어·조기 회복) 3단계로 판정하여 운동·식단·수면 모듈을 실시간 연동 조절하는 오토레귤레이션(Autoregulation) 체계.
_Avoid_: Condition Score, Daily Mood, Fatigue Level
