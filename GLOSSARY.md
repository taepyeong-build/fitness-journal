# Personal Health Repository

개인의 건강 개선을 위해 자신의 상태(`Profile`), 과학적·경험적 근거(`Research`), 그리고 기간 한정 실험 및 실행(`Project`)을 통합 관리하는 도메인입니다.

## Language

**Profile**:
나에 대한 기준선(Baseline)이자 현재 상태의 총합. 잘 변하지 않는 고유 특성(`overview.md`), 검증을 거쳐 상시 유지 중인 루틴(`Protocol`), 한눈에 추이를 비교하는 핵심 지표 요약표(`measurements.md`), 그리고 특정 시점의 상세 검진·측정 원본인 날짜별 `Snapshot`을 포함한다.
_Avoid_: User info, Bio, Settings

**Protocol**:
검증을 거쳐 현재 일상에서 상시 유지하기로 채택한 기본 생활 루틴(상시 복용 영양제, 기본 식단 원칙, 주간 기본 운동 루틴 등). 성공적인 `Project`의 결과물이 `Profile`로 승격되어 자리 잡는다.
_Avoid_: Routine, Habit, Rule

**Snapshot**:
건강검진, 정밀 혈액검사, 혹은 특정 `Project` 전후의 정밀 측정처럼 한 줄 요약표에 담기 어려운 특정 일자(`YYYY-MM-DD`)의 상세 생체 데이터 및 몸 상태 기록.
_Avoid_: Log, Backup, History

**Research**:
건강 개선 가설을 세우거나 의문을 해결하기 위해 수집·정리한 지식 단위. 논문, 아티클, 도서 요약뿐만 아니라 이를 내 상황(`Profile`)에 어떻게 적용할지에 대한 인사이트를 포함한다.
_Avoid_: Study, Wiki, Reference, Note

**Project**:
정해진 기간 동안 명확한 건강 목표(가설)를 세우고, 이를 달성하기 위한 실행 계획, 일일/주간 실행 내역, 그리고 종료 후 회고를 기록하는 시공간적 실행 단위.
_Avoid_: Experiment, Challenge, Sprint, Campaign

**Session Module**:
가용 시간과 당일 컨디션에 맞춰 선택·조합하여 수행하는 단일 운동 세션의 설계 단위(예: 10분 익스프레스, 30분 기본기 등). 상시 채택된 주간 생활 체계인 `Protocol`과 구별된다.
_Avoid_: Workout Routine, Daily Program

**Meal Module**:
조리 가용 시간, 식사 장소(홈쿡·편의점·외식/회식), 당일 훈련 일정에 맞춰 끼니 또는 일일 단위로 선택·조합하는 영양 및 식사 설계 단위(예: 5분 익스프레스, 1플레이트 홈쿡, 외식 디펜스 등). 상시 채택된 기본 식단 원칙인 `Protocol`과 구별된다.
_Avoid_: Diet Plan, Menu, Recipe, Meal Routine

