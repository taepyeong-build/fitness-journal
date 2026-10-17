# Three-Pillar Evolution: From Ad-Hoc Hypothesis Lab to Adaptive Health OS

초기 저장소는 단발성 건강 아이디어를 `research/`에 메모하고 `project/`에서 단기 실험(채택/기각)한 뒤 정적인 습관 목록(`profile/protocols.md`)에 추가하는 '단발성 가설 실험실' 모델을 가정했다. 그러나 4대 핵심 영역(칼리스데닉스, 러닝, 대사 영양, 수면·일주기 회복)의 심층 연구를 통해 확립된 실제 도메인 모델은 영역 간 변인이 실시간으로 연동되는 **적응형 대사 회복 및 신체 재구성 운영체제(Adaptive Health & Recomposition OS)**이다.

이 변화에 맞춰 제4의 최상위 디렉토리(`playbooks/` 등)를 신설하여 구조를 파편화하는 대신, 기존의 직관적인 **3축 최상위 디렉토리(`profile/`, `research/`, `project/`)를 유지하면서 각 축의 내부 역할과 스키마를 격상**하기로 결정했다.

- **`research/` (Evidence & Domain Architecture)**: 단순 논문 요약을 넘어, 각 도메인의 과학적 메커니즘과 영구적 운영 설계도(단계별 `Lv` 스케일링 매트릭스, `Session`/`Meal`/`Recovery Module` 카탈로그, 객관적 `Progression Gate`, `Readiness Traffic Light` 오토레귤레이션 규칙)를 단일 아키텍처 문서(`*-architecture.md`)로 통합 관리한다. 문서와 실행 매뉴얼을 별도 폴더로 쪼개면 생리학적 근거와 실행 규칙 간의 맥락이 단절되고 유지보수 비용이 두 배로 증가하기 때문이다.
- **`profile/` (Active State Dashboard & 3-Cycle Telemetry)**: `protocols.md`는 정적 습관 메모장이 아니라 **현재 활성 레벨(`Lv`) 상태표, 24시간 일주기 마스터 앵커, `Readiness Traffic Light` 요약, 4슬롯 서플리먼트 스택**을 담는 라이브 대시보드 역할을 하며 상세 모듈 사양은 `research/*-architecture.md`의 해당 섹션으로 딥링크(Deep-link)한다. `measurements.md`는 주간(체성분·허리둘레·워치 수면/HRV)·메조사이클(트랙별 `Lv` 및 러닝 EF)·분기(HOMA-IR, TG/HDL, ApoB, hs-CRP 등 정밀 혈액 지표)의 **3주기 모니터링 체계**를 수용한다.
- **`project/` (Time-Boxed Mesocycle & Progression Execution)**: `project/`는 단발성 가설 검증뿐만 아니라 4주/8주 메조사이클 단위로 목표 레벨(`Lv`)의 `Progression Gate`(14일 중 12일 준수율 `≥85%`, 무통증 NRS 0~1 등) 통과를 실행·검증하고, 완료 시 달성된 레벨과 프로토콜을 `profile/`로 승격(Commit)하는 실행 엔진으로 운영한다.
