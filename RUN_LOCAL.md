# U-Quest 로컬에서 실행하기 (시연 가이드)

내 컴퓨터에서 앱을 띄워 직접 클릭해보는 방법입니다. 두 가지 모드가 있습니다.

- **간단 모드 (설정 0, 추천 시작)**: 아무 설정 없이 실행 → 데모(목업) 데이터로 화면이 전부 동작합니다. 비밀번호/키 필요 없음.
- **실제 DB 모드**: Supabase 키 3개를 넣으면 진짜 운영 DB(uquest)에 붙어서 데이터가 실제로 저장됩니다.

---

## 0. 준비물: Node.js 설치 (최초 1회)

- https://nodejs.org 에서 **LTS 버전(20 이상)** 을 받아 설치합니다.
- 설치 확인: 터미널(맥: 터미널 / 윈도우: PowerShell)에서
  ```bash
  node -v
  ```
  `v20...` 처럼 나오면 OK.

## 1. 코드 받기 (최초 1회)

```bash
git clone https://github.com/luxuryguy562-cmyk/ureem_UQuest.git
cd ureem_UQuest
git checkout claude/determined-hopper-gph4rg
```

## 2. 패키지 설치 (최초 1회)

```bash
npm install
```

## 3-A. 간단 모드로 실행 (설정 없이 바로)

```bash
npm run dev
```

브라우저에서 **http://localhost:3000** 접속.
→ 데모 데이터로 모든 화면이 동작합니다. (종료: 터미널에서 `Ctrl + C`)

## 3-B. 실제 DB 모드로 실행 (선택)

1. 프로젝트 폴더에 `.env.local` 파일을 만들고, `.env.local.example` 내용을 복사해 값을 채웁니다.
2. 값 3개는 Supabase 대시보드에서 가져옵니다:
   - https://supabase.com/dashboard/project/ofeqiqauhvcovtzjangm/settings/api
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** 키 → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** 키 → `SUPABASE_SERVICE_ROLE_KEY` (비밀키이니 외부 공유 금지)
3. 저장 후 다시 `npm run dev` → http://localhost:3000

> ⚠️ 실제 DB 모드에서 하는 행동(가입/출석/포인트 등)은 **진짜 운영 DB에 저장**됩니다. 연습은 간단 모드를 권장합니다.

---

## 로그인 계정

**간단 모드(데모 데이터):** 비밀번호는 모두 `demo`
| 역할 | 아이디 |
|---|---|
| 신입 | `rookie.kim` |
| 점장 | `manager.gn` |
| 본사관리자 | `admin.hq` |

**실제 DB 모드:** 비밀번호는 모두 `demo`
| 역할 | 아이디 |
|---|---|
| 본사관리자 | `admin.hq` |
| 점장 | `manager.gn` |

신입 계정은 아직 없으니, 첫 화면에서 **회원가입**으로 새 신입을 만든 뒤
`admin.hq` 로 로그인해 **승인**하면 신입 기능을 쓸 수 있습니다.

---

## 자주 막히는 곳

- `npm: command not found` → Node.js가 설치 안 된 것. 0번 다시.
- 포트 충돌(3000 사용 중) → `npm run dev -- -p 3001` 후 http://localhost:3001
- 화면이 비어 보임 → 새로고침, 그래도 안 되면 터미널 메시지 확인.
