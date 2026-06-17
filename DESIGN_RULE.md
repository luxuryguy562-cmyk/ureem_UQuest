# DESIGN_RULE.md

## 디자인 기준

U-Quest는 기업 온보딩 앱이다.

게임처럼 보일 수는 있지만, 사용자가 수행하는 행동은 출석, 학습, 퀴즈, AX/DX 인증이어야 한다.

---

## 핵심 톤

- 실무 앱처럼 명확해야 한다.
- 게임 앱처럼 진행감이 있어야 한다.
- 텍스트 나열과 그림 나열을 모두 피한다.
- 보상보다 "오늘 무엇을 하면 되는지"가 먼저 보여야 한다.

---

## 모바일 기준

- 기본 검수 폭: 390px
- 최소 대응 폭: 360px
- 태블릿 검수 폭: 768px
- 하단 탭은 신입 화면에만 노출한다.
- 버튼, 카드, 탭의 텍스트는 부모 요소 밖으로 나가면 안 된다.
- 긴 이름, 긴 쿠폰명, 긴 배지명은 줄바꿈 또는 말줄임 처리한다.

---

## 게임화 기준

사용:

- 캐릭터 단계
- 배지 도감
- 퀴즈 티어
- AX 로봇 성장
- 희귀 배지
- 프로필 자랑 요소

사용하지 않음:

- 나무 타격
- 검 강화
- 타격권
- 숨은 코인
- 채굴
- 룰렛
- 슬롯
- 전투력 중심 RPG

---

## 캐릭터 기준

캐릭터는 메인 보상 상품이 아니다.

캐릭터는 다음을 보여주는 진행도 시각화 장치다.

- 온보딩 진행률
- 학습/퀴즈/AX 참여도
- 직원 간 자랑 요소

캐릭터 이미지는 도트 RPG 스타일로 새로 제작한다.

필요 단계:

```text
남성 5단계
여성 5단계
```

현재 적용 에셋:

```text
public/assets/uquest/generated/characters/male_lv1.png
public/assets/uquest/generated/characters/male_lv2.png
public/assets/uquest/generated/characters/male_lv3.png
public/assets/uquest/generated/characters/male_lv4.png
public/assets/uquest/generated/characters/male_lv5.png
public/assets/uquest/generated/characters/female_lv1.png
public/assets/uquest/generated/characters/female_lv2.png
public/assets/uquest/generated/characters/female_lv3.png
public/assets/uquest/generated/characters/female_lv4.png
public/assets/uquest/generated/characters/female_lv5.png
```

---

## AX 로봇 기준

AX 로봇은 AX/DX 활용 습관을 보여준다.

단계:

```text
Explorer
User
Expert
Master
```

Master만 가장 화려하게 표현한다.

현재 생성 에셋:

```text
public/assets/uquest/generated/ax-robots/ax_robot_explorer.png
public/assets/uquest/generated/ax-robots/ax_robot_user.png
public/assets/uquest/generated/ax-robots/ax_robot_expert.png
public/assets/uquest/generated/ax-robots/ax_robot_master.png
```

## 퀴즈 티어 기준

퀴즈 티어는 텍스트 칩이 아니라 게임 엠블럼으로 표시한다.

현재 적용 에셋:

```text
public/assets/uquest/generated/tiers/tier_unranked.png
public/assets/uquest/generated/tiers/tier_bronze.png
public/assets/uquest/generated/tiers/tier_silver.png
public/assets/uquest/generated/tiers/tier_gold.png
public/assets/uquest/generated/tiers/tier_platinum.png
public/assets/uquest/generated/tiers/tier_diamond.png
```

---

## 배지 기준

배지는 작은 크기에서도 구분 가능해야 한다.

구분:

- 출석 배지
- 퀴즈 배지
- 티어 배지
- 희귀 배지

희귀 배지는 획득 전 `???` 또는 잠금 상태로 보여줄 수 있다.

배지 에셋은 `public/assets/uquest/generated/badges/`를 사용한다.

---

## 색과 UI

- 포인트/보상: 골드 계열을 보조 색으로 사용
- 학습/진행: 블루 계열
- 완료/성장: 그린 계열
- 경고/차단: 오렌지 또는 레드 계열
- 화면 전체가 한 가지 색 계열로만 보이면 안 된다.

---

## 화면 구성 원칙

홈:

- 성장 쇼케이스: 프로필형 카드 안에서 상단 사용자/퀴즈 티어, 중앙 캐릭터와 AX 로봇으로 배치
- 파란 히어로 카드는 성장 쇼케이스와 중복되므로 사용하지 않는다.
- 캐릭터는 주인공 크기로, AX 로봇은 오른쪽 아래 동행 파트너 크기로 배치한다.
- 오늘 수행 항목
- 메뉴

학습:

- 20일 커리큘럼
- Day 상세
- 학습 완료 버튼

퀴즈:

- Day 선택
- 문제 풀이
- 제출 후 정답/해설 표시

AX:

- 현재 AX 로봇 단계
- AX/DX 7개 고정 항목
- 업로드 인증 버튼

프로필:

- 첫 카드에서 캐릭터, 퀴즈 티어, AX 로봇을 함께 보여준다.
- 구도는 상단 사용자 신분/퀴즈 티어, 중앙 큰 캐릭터/작은 AX 로봇, 하단 핵심 지표 배치를 따른다.
- 포인트는 보조 정보로 두고, 성장/자랑 요소가 먼저 보이게 한다.
- 최근 획득 배지는 프로필 하단에 가로 스트립으로 배치해 자랑 요소를 빠르게 확인하게 한다.

배지도감:

- 카테고리별 배지
- 획득/미획득 상태

상점:

- 수료 전 잠금
- 수료 후 쿠폰 교환
- 재고/무제한/재고 없음 상태

관리자:

- 대시보드
- 회원
- 커리큘럼
- AX
- 쿠폰
- 검증

---

## 접근성 기준

- 버튼은 실제 `button` 요소를 사용한다.
- 클릭 가능한 카드도 키보드 접근이 가능해야 한다.
- 색만으로 상태를 구분하지 않고 텍스트 상태를 함께 표시한다.
- 모달은 명확한 제목과 확인 버튼을 가진다.

---

## 변경 이력

### 2026-06-16

- 최종 PRD/CHANGELOG 기준으로 디자인 규칙을 재정의했다.
- 나무/검/타격권 중심 표현을 폐기했다.
- AX 로봇 생성 에셋 경로를 명시했다.
