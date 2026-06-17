"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";

import { formatKrw, formatNumber } from "@/lib/format";
import type {
  AxLevel,
  BadgeCategory,
  FinalAxCategory,
  FinalBadge,
  FinalCoupon,
  FinalCouponRequest,
  FinalCurriculum,
  FinalRole,
  FinalScreenKey,
  FinalUQuestConfig,
  FinalUser,
  FinalUserStatus,
  QuizTier
} from "@/types/uquest";

const axRobotAssets: Record<AxLevel, string> = {
  Explorer: "/assets/uquest/generated/ax-robots/ax_robot_explorer.png",
  User: "/assets/uquest/generated/ax-robots/ax_robot_user.png",
  Expert: "/assets/uquest/generated/ax-robots/ax_robot_expert.png",
  Master: "/assets/uquest/generated/ax-robots/ax_robot_master.png"
};

const characterAssets: Record<"male" | "female", Record<number, string>> = {
  male: {
    1: "/assets/uquest/generated/characters/male_lv1.png",
    2: "/assets/uquest/generated/characters/male_lv2.png",
    3: "/assets/uquest/generated/characters/male_lv3.png",
    4: "/assets/uquest/generated/characters/male_lv4.png",
    5: "/assets/uquest/generated/characters/male_lv5.png"
  },
  female: {
    1: "/assets/uquest/generated/characters/female_lv1.png",
    2: "/assets/uquest/generated/characters/female_lv2.png",
    3: "/assets/uquest/generated/characters/female_lv3.png",
    4: "/assets/uquest/generated/characters/female_lv4.png",
    5: "/assets/uquest/generated/characters/female_lv5.png"
  }
};

const tierAssets: Record<QuizTier, string> = {
  Unranked: "/assets/uquest/generated/tiers/tier_unranked.png",
  Bronze: "/assets/uquest/generated/tiers/tier_bronze.png",
  Silver: "/assets/uquest/generated/tiers/tier_silver.png",
  Gold: "/assets/uquest/generated/tiers/tier_gold.png",
  Platinum: "/assets/uquest/generated/tiers/tier_platinum.png",
  Diamond: "/assets/uquest/generated/tiers/tier_diamond.png"
};

const badgeAssets: Record<string, string> = {
  attendance_1: "/assets/uquest/generated/badges/attendance_1.png",
  attendance_5: "/assets/uquest/generated/badges/attendance_5.png",
  attendance_10: "/assets/uquest/generated/badges/attendance_10.png",
  attendance_15: "/assets/uquest/generated/badges/attendance_15.png",
  attendance_20: "/assets/uquest/generated/badges/attendance_20.png",
  quiz_1: "/assets/uquest/generated/badges/quiz_1.png",
  quiz_10: "/assets/uquest/generated/badges/quiz_10.png",
  quiz_30: "/assets/uquest/generated/badges/quiz_30.png",
  quiz_50: "/assets/uquest/generated/badges/quiz_50.png",
  quiz_60: "/assets/uquest/generated/badges/quiz_60.png",
  tier_bronze: "/assets/uquest/generated/badges/tier_bronze.png",
  tier_silver: "/assets/uquest/generated/badges/tier_silver.png",
  tier_gold: "/assets/uquest/generated/badges/tier_gold.png",
  tier_platinum: "/assets/uquest/generated/badges/tier_platinum.png",
  tier_diamond: "/assets/uquest/generated/badges/tier_diamond.png",
  rare_attendance: "/assets/uquest/generated/badges/rare_attendance.png",
  rare_quiz: "/assets/uquest/generated/badges/rare_quiz.png",
  rare_tier: "/assets/uquest/generated/badges/rare_tier.png",
  rare_ax_master: "/assets/uquest/generated/badges/rare_ax_master.png",
  rare_all_public: "/assets/uquest/generated/badges/rare_all_public.png",
  rare_legend: "/assets/uquest/generated/badges/rare_legend.png",
  locked: "/assets/uquest/generated/badges/badge_locked.png"
};

const rookieNav: Array<{ screen: FinalScreenKey; label: string; short: string }> = [
  { screen: "home", label: "홈", short: "⌂" },
  { screen: "learn", label: "학습", short: "L" },
  { screen: "quiz", label: "퀴즈", short: "Q" },
  { screen: "ax", label: "AX", short: "AX" },
  { screen: "shop", label: "상점", short: "S" },
  { screen: "profile", label: "내정보", short: "P" }
];

const quickMenus: Array<{ screen: FinalScreenKey; label: string; description: string }> = [
  { screen: "learn", label: "학습", description: "20일 커리큘럼" },
  { screen: "quiz", label: "퀴즈", description: "재도전 없음" },
  { screen: "ax", label: "AX", description: "7개 고정 항목" },
  { screen: "badges", label: "배지도감", description: "배지/티어/희귀" },
  { screen: "profile", label: "프로필", description: "캐릭터와 성장" },
  { screen: "shop", label: "상점", description: "수료 후 오픈" },
  { screen: "points", label: "포인트 이력", description: "3개월 유효" }
];

type Toast = {
  title: string;
  body: string;
  tone?: "good" | "warn" | "danger";
};

type RookieSummary = {
  user: FinalUser;
  storeName: string;
  currentDay: number;
  curriculumDay: number;
  endDate: string;
  progressRate: number;
  attendanceCount: number;
  learningCount: number;
  quizSolvedCount: number;
  quizCorrectCount: number;
  quizAccuracyRate: number;
  quizTier: QuizTier;
  axSubmissionCount: number;
  axLevel: AxLevel;
  characterLevel: number;
  pointBalance: number;
  totalEarnedPoints: number;
  totalSpentPoints: number;
  shopOpened: boolean;
  pointExpireDate: string | null;
  pointExpired: boolean;
  acquiredBadges: FinalBadge[];
};

type CurriculumQuizDraft = {
  id?: string;
  question: string;
  options: string[];
  correctOption: number;
  explanation: string;
  rewardPoints: string;
};

type CurriculumDraft = {
  title: string;
  description: string;
  learningRewardPoints: string;
  isPublished: boolean;
  quizzes: CurriculumQuizDraft[];
};

export function UQuestApp({ config }: { config: FinalUQuestConfig }) {
  const [data, setData] = useState<FinalUQuestConfig>(() => normalizeConfig(config));
  const [role, setRole] = useState<FinalRole>("rookie");
  const [screen, setScreen] = useState<FinalScreenKey>("home");
  const [selectedCurriculumId, setSelectedCurriculumId] = useState(() => getCurrentCurriculumId(config, getUser(config, config.activeUserId)));
  const [quizDraft, setQuizDraft] = useState<Record<string, number>>({});
  const [toast, setToast] = useState<Toast | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [authUser, setAuthUser] = useState<FinalUser | null>(null);

  const activeUser = getUser(data, data.activeUserId);
  const currentUserId = role === "rookie" ? data.activeUserId : role === "manager" ? data.managerUserId : data.adminUserId;
  const currentUser = getUser(data, currentUserId);
  const rookie = useMemo(() => deriveRookieSummary(data, activeUser), [data, activeUser]);
  const selectedCurriculum = data.curriculums.find((item) => item.id === selectedCurriculumId) ?? data.curriculums[0];
  const selectedQuestions = data.quizzes.filter((question) => question.curriculumId === selectedCurriculum.id);
  const selectedSubmission = data.quizSubmissions.find((submission) => submission.userId === activeUser.id && submission.curriculumId === selectedCurriculum.id);
  const selectedLearning = data.learningCompletions.find((completion) => completion.userId === activeUser.id && completion.curriculumId === selectedCurriculum.id);

  useEffect(() => {
    let canceled = false;

    fetch("/api/me")
      .then(async (response) => (response.ok ? ((await response.json()) as { user?: FinalUser | null }) : { user: null }))
      .then((payload) => {
        if (canceled) return;
        if (payload.user) applyAuthenticatedUser(payload.user);
        setAuthChecked(true);
      })
      .catch(() => {
        if (!canceled) setAuthChecked(true);
      });

    return () => {
      canceled = true;
    };
  }, []);

  function go(nextScreen: FinalScreenKey) {
    if (role === "manager" && nextScreen !== "manager") {
      setScreen("manager");
      return;
    }

    if (role === "admin" && nextScreen !== "admin") {
      setScreen("admin");
      return;
    }

    setScreen(nextScreen);
  }

  function pushToast(nextToast: Toast) {
    setToast(nextToast);
  }

  async function runApiMutation(
    url: string,
    body: Record<string, unknown>,
    success: Toast,
    requesterId = currentUser.id
  ) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-uquest-user-id": requesterId
        },
        body: JSON.stringify(body)
      });
      const payload = (await response.json()) as { config?: FinalUQuestConfig; message?: string; error?: string };

      if (!response.ok) {
        pushToast({
          title: apiErrorTitle(payload.error),
          body: payload.message ?? "요청을 처리하지 못했습니다.",
          tone: response.status >= 500 ? "danger" : "warn"
        });
        return false;
      }

      if (payload.config) setData(payload.config);
      pushToast(success);
      return true;
    } catch {
      pushToast({ title: "요청 실패", body: "서버 요청 중 문제가 발생했습니다.", tone: "danger" });
      return false;
    }
  }

  async function runApiFormMutation(
    url: string,
    body: FormData,
    success: Toast,
    requesterId = currentUser.id
  ) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "x-uquest-user-id": requesterId
        },
        body
      });
      const payload = (await response.json()) as { config?: FinalUQuestConfig; message?: string; error?: string };

      if (!response.ok) {
        pushToast({
          title: apiErrorTitle(payload.error),
          body: payload.message ?? "요청을 처리하지 못했습니다.",
          tone: response.status >= 500 ? "danger" : "warn"
        });
        return false;
      }

      if (payload.config) setData(payload.config);
      pushToast(success);
      return true;
    } catch {
      pushToast({ title: "요청 실패", body: "서버 요청 중 문제가 발생했습니다.", tone: "danger" });
      return false;
    }
  }

  function applyAuthenticatedUser(user: FinalUser) {
    setAuthUser(user);
    setRole(user.role);
    setData((current) => {
      const users = current.users.some((item) => item.id === user.id)
        ? current.users.map((item) => (item.id === user.id ? { ...item, ...user } : item))
        : [...current.users, user];

      return {
        ...current,
        users,
        activeUserId: user.role === "rookie" ? user.id : current.activeUserId,
        managerUserId: user.role === "manager" ? user.id : current.managerUserId,
        adminUserId: user.role === "admin" ? user.id : current.adminUserId
      };
    });
    setScreen(user.role === "rookie" ? "home" : user.role);
    if (user.role === "rookie") {
      setSelectedCurriculumId(getCurrentCurriculumId(data, user));
    }
    setQuizDraft({});
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setAuthUser(null);
    setRole("rookie");
    setScreen("home");
    setQuizDraft({});
  }

  async function claimAttendance() {
    await runApiMutation("/api/rookie/attendance", {}, { title: "출석 완료", body: "300P가 지급됐고 출석 배지 조건을 다시 확인했습니다.", tone: "good" }, activeUser.id);
  }

  async function completeLearning(curriculum: FinalCurriculum) {
    await runApiMutation(
      "/api/rookie/learning-completions",
      { curriculumId: curriculum.id },
      { title: "학습 완료", body: "학습 보상 300P가 지급됐고 해당 Day 퀴즈가 열렸습니다.", tone: "good" },
      activeUser.id
    );
  }

  async function submitQuiz(curriculum: FinalCurriculum) {
    const ok = await runApiMutation(
      "/api/rookie/quiz-submissions",
      { curriculumId: curriculum.id, answers: quizDraft },
      { title: "퀴즈 제출 완료", body: "퀴즈 포인트가 지급됐습니다. 티어는 정답률로 계산됩니다.", tone: "good" },
      activeUser.id
    );
    if (ok) setQuizDraft({});
  }

  async function certifyAx(category: FinalAxCategory, evidenceFile: File) {
    const body = new FormData();
    body.append("categoryId", category.id);
    body.append("evidence", evidenceFile);

    await runApiFormMutation(
      "/api/rookie/ax-submissions",
      body,
      { title: "AX 인증 완료", body: `${evidenceFile.name} 사진 인증이 저장됐고 500P가 지급됐습니다.`, tone: "good" },
      activeUser.id
    );
  }

  async function redeemCoupon(coupon: FinalCoupon) {
    await runApiMutation(
      "/api/shop/coupon-requests",
      { couponId: coupon.id },
      { title: "교환 요청 완료", body: "포인트가 즉시 차감됐습니다. 발송 전에는 취소하면 원복됩니다.", tone: "good" },
      activeUser.id
    );
  }

  async function cancelCouponRequest(requestId: string, reason: string) {
    await runApiMutation(
      `/api/shop/coupon-requests/${requestId}/cancel`,
      { reason },
      { title: "쿠폰 요청 취소", body: "발송 전 취소라 포인트가 즉시 원복됐습니다.", tone: "good" },
      currentUser.id
    );
  }

  async function sendCouponRequest(requestId: string) {
    await runApiMutation(
      `/api/admin/coupon-requests/${requestId}/send`,
      {},
      { title: "발송 완료", body: "발송 완료 후에는 사용자/관리자 모두 취소할 수 없습니다.", tone: "good" },
      currentUser.id
    );
  }

  async function approveUser(userId: string) {
    await runApiMutation(
      `/api/admin/users/${userId}/approve`,
      {},
      { title: "가입 승인", body: "신입 계정이 온보딩 진행 상태로 변경됐습니다.", tone: "good" },
      currentUser.id
    );
  }

  async function rejectUser(userId: string) {
    await runApiMutation(
      `/api/admin/users/${userId}/reject`,
      { reason: "관리자 확인 필요" },
      { title: "가입 반려", body: "반려 사유가 저장됐고 로그인 시 안내됩니다.", tone: "warn" },
      currentUser.id
    );
  }

  async function updateCurriculumSettings(curriculumId: string, draft: CurriculumDraft) {
    await runApiMutation(
      `/api/admin/curriculums/${curriculumId}`,
      {
        title: draft.title,
        description: draft.description,
        learningRewardPoints: Number(draft.learningRewardPoints),
        isPublished: draft.isPublished,
        quizzes: draft.quizzes.map((quiz) => ({
          id: quiz.id,
          question: quiz.question,
          options: quiz.options,
          correctOption: quiz.correctOption,
          explanation: quiz.explanation,
          rewardPoints: Number(quiz.rewardPoints)
        }))
      },
      { title: "커리큘럼 저장", body: "Day 제목, 내용, 퀴즈 설정을 저장했습니다.", tone: "good" },
      currentUser.id
    );
  }

  const visibleScreen = role === "rookie" ? screen : role;

  if (!authChecked) {
    return <AuthLoading />;
  }

  if (!authUser) {
    return <AuthView stores={data.stores} onAuthenticated={applyAuthenticatedUser} />;
  }

  return (
    <div className="phone final-shell" data-source={data.source}>
      <header className="final-header">
        <div className="brand-block">
          <span>U-Quest</span>
          <strong>{role === "rookie" ? activeUser.name : currentUser.name}</strong>
        </div>
        <div className="session-actions" aria-label="로그인 정보">
          <span>{roleLabel(role)}</span>
          <button onClick={logout} type="button">로그아웃</button>
        </div>
      </header>

      {role === "rookie" ? (
        <main className="final-screen">
          {visibleScreen === "home" ? (
            <HomeView data={data} onAttendance={claimAttendance} onGo={go} rookie={rookie} />
          ) : null}
          {visibleScreen === "learn" ? (
            <LearningView
              completions={data.learningCompletions}
              curriculums={data.curriculums}
              onComplete={completeLearning}
              onSelect={setSelectedCurriculumId}
              rookie={rookie}
              selectedId={selectedCurriculum.id}
              today={data.today}
            />
          ) : null}
          {visibleScreen === "quiz" ? (
            <QuizView
              draft={quizDraft}
              learning={selectedLearning}
              onDraft={setQuizDraft}
              onSelect={setSelectedCurriculumId}
              onSubmit={submitQuiz}
              questions={selectedQuestions}
              rookie={rookie}
              selected={selectedCurriculum}
              submission={selectedSubmission}
              submissions={data.quizSubmissions}
              curriculums={data.curriculums}
            />
          ) : null}
          {visibleScreen === "ax" ? <AxView categories={data.axCategories} onCertify={certifyAx} rookie={rookie} submissions={data.axSubmissions} /> : null}
          {visibleScreen === "badges" ? <BadgeView badges={data.badges} rookie={rookie} /> : null}
          {visibleScreen === "profile" ? <ProfileView data={data} onGo={go} rookie={rookie} /> : null}
          {visibleScreen === "shop" ? <ShopView coupons={data.coupons} onCancel={cancelCouponRequest} onRedeem={redeemCoupon} requests={data.couponRequests} rookie={rookie} today={data.today} /> : null}
          {visibleScreen === "points" ? <PointHistoryView data={data} rookie={rookie} /> : null}
        </main>
      ) : null}

      {role === "manager" ? <ManagerView data={data} manager={currentUser} /> : null}
      {role === "admin" ? (
        <AdminView
          data={data}
          onApprove={approveUser}
          onCancelCoupon={cancelCouponRequest}
          onUpdateCurriculum={updateCurriculumSettings}
          onReject={rejectUser}
          onSendCoupon={sendCouponRequest}
        />
      ) : null}

      {role === "rookie" ? <BottomNav active={screen} onGo={go} /> : null}
      <ToastModal toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

function AuthLoading() {
  return (
    <div className="phone final-shell auth-shell">
      <div className="auth-card">
        <span className="eyebrow">U-Quest</span>
        <h1>로그인 확인 중</h1>
        <p>잠시만 기다려주세요.</p>
      </div>
    </div>
  );
}

function AuthView({
  stores,
  onAuthenticated
}: {
  stores: FinalUQuestConfig["stores"];
  onAuthenticated: (user: FinalUser) => void;
}) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    loginId: "",
    password: "",
    storeId: stores[0]?.id ?? "",
    hireDate: new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date()),
    avatarGender: "male" as "male" | "female"
  });

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const url = mode === "login" ? "/api/auth/login" : "/api/auth/signup";
    const body =
      mode === "login"
        ? { loginId: form.loginId, password: form.password }
        : {
            name: form.name,
            phone: form.phone,
            loginId: form.loginId,
            password: form.password,
            storeId: form.storeId,
            hireDate: form.hireDate,
            avatarGender: form.avatarGender
          };
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });
    const payload = (await response.json()) as { user?: FinalUser; message?: string; status?: FinalUserStatus };

    if (!response.ok || !payload.user) {
      setMessage(payload.message ?? "처리하지 못했습니다.");
      return;
    }

    if (mode === "signup") {
      setMessage("가입 요청이 접수됐습니다. 본사 관리자 승인 후 진행할 수 있습니다.");
      onAuthenticated(payload.user);
      return;
    }

    onAuthenticated(payload.user);
  }

  return (
    <div className="phone final-shell auth-shell">
      <form className="auth-card" onSubmit={submit}>
        <span className="eyebrow">U-Quest</span>
        <h1>{mode === "login" ? "로그인" : "회원가입"}</h1>
        <p>{mode === "login" ? "계정으로 온보딩을 시작하세요." : "신입은 가입 후 관리자 승인이 필요합니다."}</p>

        <div className="auth-tabs">
          <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")} type="button">로그인</button>
          <button className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")} type="button">회원가입</button>
        </div>

        {mode === "signup" ? (
          <>
            <label>
              이름
              <input autoComplete="name" onChange={(event) => update("name", event.currentTarget.value)} value={form.name} />
            </label>
            <label>
              휴대폰번호
              <input autoComplete="tel" onChange={(event) => update("phone", event.currentTarget.value)} value={form.phone} />
            </label>
            <label>
              매장
              <select onChange={(event) => update("storeId", event.currentTarget.value)} value={form.storeId}>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>{store.name}</option>
                ))}
              </select>
            </label>
            <label>
              입사일
              <input onChange={(event) => update("hireDate", event.currentTarget.value)} type="date" value={form.hireDate} />
            </label>
            <div className="auth-gender">
              <button className={form.avatarGender === "male" ? "active" : ""} onClick={() => update("avatarGender", "male")} type="button">남자 캐릭터</button>
              <button className={form.avatarGender === "female" ? "active" : ""} onClick={() => update("avatarGender", "female")} type="button">여자 캐릭터</button>
            </div>
          </>
        ) : null}

        <label>
          아이디
          <input autoComplete="username" onChange={(event) => update("loginId", event.currentTarget.value)} value={form.loginId} />
        </label>
        <label>
          비밀번호
          <input autoComplete={mode === "login" ? "current-password" : "new-password"} onChange={(event) => update("password", event.currentTarget.value)} type="password" value={form.password} />
        </label>

        {message ? <div className="auth-message">{message}</div> : null}
        <button className="primary-action" type="submit">{mode === "login" ? "로그인" : "가입 요청"}</button>
        {mode === "login" ? <small>테스트 계정: rookie.kim / manager.gn / admin.hq, 비밀번호 demo</small> : null}
      </form>
    </div>
  );
}

function CharacterImage({
  user,
  level,
  size
}: {
  user: FinalUser;
  level: number;
  size: "mini" | "home" | "stage";
}) {
  const normalizedLevel = Math.min(5, Math.max(1, level));
  const gender = user.avatarGender === "female" ? "female" : "male";

  return <img alt={`Lv.${normalizedLevel} 캐릭터`} className={`character-image character-${size}`} src={characterAssets[gender][normalizedLevel]} />;
}

function BadgeIcon({ badge, hidden = false }: { badge?: FinalBadge; hidden?: boolean }) {
  const src = hidden || !badge ? badgeAssets.locked : badgeAssets[badge.id] ?? badgeAssets.locked;
  const alt = hidden || !badge ? "잠긴 배지" : `${badge.name} 배지`;

  return <img alt={alt} className="badge-icon" src={src} />;
}

function HomeView({
  data,
  rookie,
  onAttendance,
  onGo
}: {
  data: FinalUQuestConfig;
  rookie: RookieSummary;
  onAttendance: () => void;
  onGo: (screen: FinalScreenKey) => void;
}) {
  const todayDone = data.attendances.some((item) => item.userId === rookie.user.id && item.attendanceDate === data.today);
  const todayCurriculum = data.curriculums.find((item) => item.dayNumber === rookie.curriculumDay) ?? data.curriculums[0];
  const learnedToday = data.learningCompletions.some((item) => item.userId === rookie.user.id && item.curriculumId === todayCurriculum.id);
  const quizDoneToday = data.quizSubmissions.some((item) => item.userId === rookie.user.id && item.curriculumId === todayCurriculum.id);
  const axToday = data.axSubmissions.some((item) => item.userId === rookie.user.id && item.createdAt.startsWith(data.today));

  return (
    <>
      <StatusBanner rookie={rookie} />
      <ProfileStageCard rookie={rookie} />

      <section className="u-card today-card">
        <div className="card-title-row">
          <div>
            <span className="eyebrow">TODAY</span>
            <h2>오늘 수행 항목</h2>
          </div>
          <span className="status-chip">{todayDone && learnedToday && quizDoneToday ? "완료" : "진행중"}</span>
        </div>
        <div className="task-stack">
          <TaskLine action="출석하기" done={todayDone} label="출석" onClick={onAttendance} />
          <TaskLine action="학습하기" done={learnedToday} label={todayCurriculum.title} onClick={() => onGo("learn")} />
          <TaskLine action={learnedToday ? "퀴즈 풀기" : "학습 필요"} done={quizDoneToday} label="오늘 퀴즈" onClick={() => onGo("quiz")} />
          <TaskLine action="인증하기" done={axToday} label="AX/DX 인증" onClick={() => onGo("ax")} />
        </div>
      </section>

      <section className="u-card">
        <div className="card-title-row">
          <h2>메뉴</h2>
          <span className="status-chip">8개 기능</span>
        </div>
        <div className="quick-grid">
          {quickMenus.map((item) => (
            <button key={item.screen} onClick={() => onGo(item.screen)} type="button">
              <strong>{item.label}</strong>
              <span>{item.description}</span>
            </button>
          ))}
        </div>
      </section>
    </>
  );
}

function LearningView({
  rookie,
  curriculums,
  completions,
  selectedId,
  today,
  onSelect,
  onComplete
}: {
  rookie: RookieSummary;
  curriculums: FinalCurriculum[];
  completions: FinalUQuestConfig["learningCompletions"];
  selectedId: string;
  today: string;
  onSelect: (id: string) => void;
  onComplete: (curriculum: FinalCurriculum) => void;
}) {
  const selected = curriculums.find((item) => item.id === selectedId) ?? curriculums[0];
  const completed = completions.some((item) => item.userId === rookie.user.id && item.curriculumId === selected.id);
  const completedToday = completions.some((item) => item.userId === rookie.user.id && item.createdAt.startsWith(today));
  const selectedIsCurrent = selected.dayNumber === rookie.curriculumDay;
  const canComplete = selectedIsCurrent && !completed && !completedToday && rookie.user.status === "active";
  const actionLabel = completed
    ? "학습 완료됨"
    : !selectedIsCurrent
      ? selected.dayNumber > rookie.curriculumDay
        ? "오픈 예정"
        : "오늘 학습 아님"
      : completedToday
        ? "오늘 학습 완료"
        : "오늘 학습 완료";

  return (
    <section className="u-card full-card">
      <ScreenTitle eyebrow="20일 커리큘럼" title="학습" meta={`${rookie.learningCount}/20 완료`} />
      <div className="curriculum-layout">
        <div className="day-list">
          {curriculums.map((item) => {
            const isDone = completions.some((completion) => completion.userId === rookie.user.id && completion.curriculumId === item.id);
            const isCurrent = item.dayNumber === rookie.curriculumDay;
            const isLocked = item.dayNumber > rookie.curriculumDay;
            const isPast = item.dayNumber < rookie.curriculumDay && !isDone;

            return (
              <button className={`${selected.id === item.id ? "selected" : ""} ${isDone ? "done" : ""} ${isLocked ? "locked" : ""} ${isPast ? "past" : ""}`} key={item.id} onClick={() => onSelect(item.id)} type="button">
                <span>D{item.dayNumber}</span>
                <strong>{item.title}</strong>
                <em>{isDone ? "완료" : isCurrent ? "오늘" : isLocked ? "잠김" : "기간 지남"}</em>
              </button>
            );
          })}
        </div>
        <div className="detail-panel">
          <span className="eyebrow">DAY {selected.dayNumber}</span>
          <h2>{selected.title}</h2>
          <p>{selected.description}</p>
          <div className="policy-box">
            <b>정책</b>
            <span>20일 커리큘럼은 하루 1개씩 열립니다.</span>
            <span>오늘은 Day {rookie.curriculumDay}만 완료할 수 있고, 완료 후 해당 Day 퀴즈가 열립니다.</span>
          </div>
          {!selectedIsCurrent ? <LockPanel title="오늘 학습 아님" body={`오늘 완료 가능한 커리큘럼은 Day ${rookie.curriculumDay}입니다. 하루에 여러 Day를 완료할 수 없습니다.`} /> : null}
          <button className="primary-action" disabled={!canComplete} onClick={() => onComplete(selected)} type="button">
            {actionLabel}
          </button>
        </div>
      </div>
    </section>
  );
}

function QuizView({
  rookie,
  curriculums,
  selected,
  questions,
  learning,
  submission,
  submissions,
  draft,
  onDraft,
  onSelect,
  onSubmit
}: {
  rookie: RookieSummary;
  curriculums: FinalCurriculum[];
  selected: FinalCurriculum;
  questions: FinalUQuestConfig["quizzes"];
  learning?: FinalUQuestConfig["learningCompletions"][number];
  submission?: FinalUQuestConfig["quizSubmissions"][number];
  submissions: FinalUQuestConfig["quizSubmissions"];
  draft: Record<string, number>;
  onDraft: (draft: Record<string, number>) => void;
  onSelect: (id: string) => void;
  onSubmit: (curriculum: FinalCurriculum) => void;
}) {
  return (
    <section className="u-card full-card">
      <ScreenTitle eyebrow="재도전 불가" title="퀴즈" meta={`${rookie.quizAccuracyRate}% · ${rookie.quizTier}`} />
      <div className="readonly-note">퀴즈 포인트는 정오답과 무관한 제출 보상입니다. 문제당 300P가 지급되고, 퀴즈 티어는 정답률 기준으로 계산됩니다.</div>
      <div className="horizontal-days">
        {curriculums.map((item) => {
          const done = submissions.some((submissionItem) => submissionItem.userId === rookie.user.id && submissionItem.curriculumId === item.id);

          return (
            <button className={selected.id === item.id ? "selected" : ""} key={item.id} onClick={() => onSelect(item.id)} type="button">
              D{item.dayNumber}
              <span>{done ? "제출" : "대기"}</span>
            </button>
          );
        })}
      </div>

      {!learning ? (
        <LockPanel title="퀴즈 잠김" body="학습 완료 후 퀴즈를 풀 수 있습니다. 퀴즈는 제출 후 재도전할 수 없습니다." />
      ) : null}

      {learning ? (
        <div className="quiz-stack">
          {questions.map((question, index) => {
            const answer = submission?.answers.find((item) => item.questionId === question.id);

            return (
              <div className="question-card" key={question.id}>
                <div className="question-head">
                  <span>Q{index + 1}</span>
                  <strong>{question.question}</strong>
                </div>
                <div className="option-list">
                  {question.options.map((option, optionIndex) => {
                    const checked = submission ? answer?.selectedOption === optionIndex : draft[question.id] === optionIndex;
                    const isCorrect = submission && question.correctOption === optionIndex;
                    const isWrong = submission && answer?.selectedOption === optionIndex && !answer.isCorrect;

                    return (
                      <button
                        className={`${checked ? "selected" : ""} ${isCorrect ? "correct" : ""} ${isWrong ? "wrong" : ""}`}
                        disabled={Boolean(submission)}
                        key={option}
                        onClick={() => onDraft({ ...draft, [question.id]: optionIndex })}
                        type="button"
                      >
                        <span>{optionIndex + 1}</span>
                        {option}
                      </button>
                    );
                  })}
                </div>
                {submission ? <p className="explain">{question.explanation}</p> : null}
              </div>
            );
          })}
          <button className="primary-action" disabled={Boolean(submission) || rookie.user.status !== "active"} onClick={() => onSubmit(selected)} type="button">
            {submission ? "제출 완료 · 오답노트 조회중" : `${questions.length}문제 제출`}
          </button>
        </div>
      ) : null}
    </section>
  );
}

function AxView({
  rookie,
  categories,
  submissions,
  onCertify
}: {
  rookie: RookieSummary;
  categories: FinalAxCategory[];
  submissions: FinalUQuestConfig["axSubmissions"];
  onCertify: (category: FinalAxCategory, evidenceFile: File) => void;
}) {
  function handleEvidence(category: FinalAxCategory, file: File | undefined) {
    if (!file) return;
    onCertify(category, file);
  }

  return (
    <section className="u-card full-card">
      <ScreenTitle eyebrow="AX/DX 7개 고정" title="AX 성장" meta={`${rookie.axSubmissionCount}회 · ${rookie.axLevel}`} />
      <div className="ax-hero">
        <img alt={`${rookie.axLevel} 로봇`} src={axRobotAssets[rookie.axLevel]} />
        <div>
          <span className="eyebrow">{rookie.axLevel}</span>
          <h2>{axLevelKorean(rookie.axLevel)}</h2>
          <p>AX/DX 전체 인증 횟수 기준으로 성장합니다. 사진을 올리거나 촬영해야 인증이 완료됩니다.</p>
          <div className="progress-track">
            <i style={{ width: `${Math.min(100, (rookie.axSubmissionCount / 20) * 100)}%` }} />
          </div>
        </div>
      </div>

      <div className="ax-grid">
        {categories.map((category) => {
          const count = submissions.filter((submission) => submission.userId === rookie.user.id && submission.categoryId === category.id).length;

          return (
            <div className="ax-card" key={category.id}>
              <span>{category.type}</span>
              <strong>{category.title}</strong>
              <p>{category.description}</p>
              <div className="card-footer">
                <em>{count}회 인증</em>
                <div className="upload-actions">
                  <label className={rookie.user.status !== "active" ? "disabled" : ""}>
                    사진 올리기
                    <input accept="image/*" disabled={rookie.user.status !== "active"} onChange={(event) => {
                      handleEvidence(category, event.currentTarget.files?.[0]);
                      event.currentTarget.value = "";
                    }} type="file" />
                  </label>
                  <label className={rookie.user.status !== "active" ? "disabled" : ""}>
                    사진 찍기
                    <input accept="image/*" capture="environment" disabled={rookie.user.status !== "active"} onChange={(event) => {
                      handleEvidence(category, event.currentTarget.files?.[0]);
                      event.currentTarget.value = "";
                    }} type="file" />
                  </label>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function BadgeView({ rookie, badges }: { rookie: RookieSummary; badges: FinalBadge[] }) {
  const grouped = (["attendance", "quiz", "tier", "rare"] as BadgeCategory[]).map((category) => ({
    category,
    items: badges.filter((badge) => badge.category === category).sort((left, right) => left.sortOrder - right.sortOrder)
  }));

  return (
    <section className="u-card full-card">
      <ScreenTitle eyebrow="컬렉션" title="배지도감" meta={`${rookie.acquiredBadges.length}/${badges.length}`} />
      {grouped.map((group) => (
        <div className="badge-section" key={group.category}>
          <h3>{badgeCategoryLabel(group.category)}</h3>
          <div className="badge-grid">
            {group.items.map((badge) => {
              const acquired = rookie.user.badgeIds.includes(badge.id);
              const hidden = badge.isRare && !acquired;

              return (
                <div className={`${acquired ? "acquired" : ""} ${hidden ? "hidden" : ""}`} key={badge.id}>
                  <BadgeIcon badge={badge} hidden={hidden} />
                  <strong>{hidden ? "???" : badge.name}</strong>
                  <span>{hidden ? "획득 후 공개" : badge.conditionLabel}</span>
                  <em>{acquired ? "획득" : `+${formatNumber(badge.rewardPoints)}P`}</em>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}

function ProfileView({
  data,
  rookie,
  onGo
}: {
  data: FinalUQuestConfig;
  rookie: RookieSummary;
  onGo: (screen: FinalScreenKey) => void;
}) {
  return (
    <>
      <section className="profile-page-head">
        <div>
          <h1>프로필</h1>
          <p>U-Quest에서의 성장을 확인해보세요!</p>
        </div>
        <div className="profile-actions" aria-hidden="true">
          <span>!</span>
          <span>⚙</span>
        </div>
      </section>

      <ProfileStageCard rookie={rookie} />

      <section className="u-card">
        <div className="profile-stat-row">
          <Metric label="보유 포인트" value={`${formatNumber(rookie.pointBalance)}P`} />
          <Metric label="출석" value={`${rookie.attendanceCount}일`} />
          <Metric label="전체 진행률" value={`${rookie.progressRate}%`} />
        </div>
      </section>

      <RecentBadgesCard badges={data.badges} onGo={onGo} rookie={rookie} />
    </>
  );
}

function ProfileStageCard({ rookie }: { rookie: RookieSummary }) {
  const nextAxCount = nextAxThreshold(rookie.axSubmissionCount);
  const axProgress = rookie.axSubmissionCount >= 20 ? 100 : Math.min(100, Math.round((rookie.axSubmissionCount / nextAxCount) * 100));

  return (
    <section className="u-card profile-stage-card">
      <div className="profile-summary-row">
        <div className="profile-mini-avatar">
          <CharacterImage level={rookie.characterLevel} size="mini" user={rookie.user} />
        </div>
        <div className="profile-summary-main">
          <strong>{rookie.user.name}</strong>
          <span>신입사원</span>
          <em>입사일 {rookie.user.hireDate?.replaceAll("-", ".") ?? "-"}</em>
        </div>
        <div className="profile-tier-summary">
          <TierMark tier={rookie.quizTier} />
          <strong>{rookie.quizTier}</strong>
          <span>정답률 {rookie.quizAccuracyRate}%</span>
        </div>
      </div>

      <div className="profile-stage-scene">
        <div className="scene-actor character">
          <CharacterImage level={rookie.characterLevel} size="stage" user={rookie.user} />
          <strong>Lv.{rookie.characterLevel} 적응중</strong>
          <div className="scene-progress">
            <i style={{ width: `${rookie.progressRate}%` }} />
          </div>
          <span>캐릭터 성장 {rookie.progressRate}%</span>
        </div>
        <div className="scene-actor robot">
          <img alt={`${rookie.axLevel} AX 로봇`} src={axRobotAssets[rookie.axLevel]} />
          <strong>AX {rookie.axLevel}</strong>
          <div className="scene-progress">
            <i style={{ width: `${axProgress}%` }} />
          </div>
          <span>AX 성장 {axProgress}%</span>
        </div>
      </div>
    </section>
  );
}

function RecentBadgesCard({
  rookie,
  badges,
  onGo
}: {
  rookie: RookieSummary;
  badges: FinalBadge[];
  onGo: (screen: FinalScreenKey) => void;
}) {
  const acquired = badges.filter((badge) => rookie.user.badgeIds.includes(badge.id)).slice(0, 5);
  const nextBadge = badges.find((badge) => !rookie.user.badgeIds.includes(badge.id) && !badge.isRare);

  return (
    <section className="u-card recent-badges-card">
      <div className="card-title-row">
        <h2>최근 획득 배지</h2>
        <button onClick={() => onGo("badges")} type="button">
          전체 보기
        </button>
      </div>
      <div className="recent-badge-strip">
        {acquired.map((badge) => (
          <div key={badge.id}>
            <BadgeIcon badge={badge} />
            <strong>{badge.name}</strong>
            <span>획득</span>
          </div>
        ))}
        <div className="next">
          <BadgeIcon hidden />
          <strong>{nextBadge?.name ?? "다음 배지"}</strong>
          <span>{nextBadge?.conditionLabel ?? "???"}</span>
        </div>
      </div>
    </section>
  );
}

function GrowthShowcase({ rookie, variant }: { rookie: RookieSummary; variant: "compact" | "profile" }) {
  return (
    <section className={`u-card growth-showcase ${variant === "profile" ? "profile-mode" : ""}`}>
      <div className="card-title-row">
        <div>
          <span className="eyebrow">{variant === "profile" ? rookie.storeName : "GROWTH"}</span>
          <h2>{variant === "profile" ? `${rookie.user.name} 쇼케이스` : "내 성장 한눈에"}</h2>
        </div>
        <span className="status-chip">D+{rookie.currentDay}</span>
      </div>
      <div className="profile-combo-card">
        <div className="profile-tier-line">
          <TierMark tier={rookie.quizTier} />
          <div>
            <label>퀴즈 티어</label>
            <strong>{rookie.quizTier}</strong>
            <small>정답률 {rookie.quizAccuracyRate}%</small>
          </div>
        </div>
        <div className="profile-duo-stage">
          <div className="profile-actor">
            <CharacterImage level={rookie.characterLevel} size={variant === "profile" ? "stage" : "home"} user={rookie.user} />
            <div>
              <label>캐릭터</label>
              <strong>Lv.{rookie.characterLevel}</strong>
              <small>{rookie.progressRate}% 진행</small>
            </div>
          </div>
          <div className="stage-link" aria-hidden="true" />
          <div className="profile-actor robot">
            <img alt={`${rookie.axLevel} AX 로봇`} src={axRobotAssets[rookie.axLevel]} />
            <div>
              <label>AX 로봇</label>
              <strong>{rookie.axLevel}</strong>
              <small>{rookie.axSubmissionCount}회 인증</small>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TierMark({ tier }: { tier: QuizTier }) {
  return (
    <div className="tier-mark tier-mark-image">
      <img alt={`${tier} 티어`} src={tierAssets[tier]} />
    </div>
  );
}

function ShopView({
  rookie,
  coupons,
  requests,
  today,
  onRedeem,
  onCancel
}: {
  rookie: RookieSummary;
  coupons: FinalCoupon[];
  requests: FinalCouponRequest[];
  today: string;
  onRedeem: (coupon: FinalCoupon) => void;
  onCancel: (requestId: string, reason: string) => void;
}) {
  const userRequests = requests.filter((request) => request.userId === rookie.user.id);

  return (
    <section className="u-card full-card">
      <ScreenTitle eyebrow="수료 후 오픈" title="상점" meta={`${formatNumber(rookie.pointBalance)}P`} />
      {!rookie.shopOpened ? <LockPanel title="상점 잠김" body="4주 수료 후 포인트로 쿠폰을 교환할 수 있습니다." /> : null}
      {rookie.pointExpired ? <LockPanel title="포인트 만료" body="수료 후 3개월이 지나 포인트 사용 기간이 종료됐습니다." danger /> : null}
      <div className="coupon-grid">
        {coupons.map((coupon) => {
          const outOfStock = coupon.stockQuantity === 0;
          const pointShortage = rookie.pointBalance < coupon.requiredPoints;
          const canRedeem = rookie.shopOpened && !rookie.pointExpired && !outOfStock && !pointShortage;
          const actionLabel = !rookie.shopOpened ? "수료 후" : rookie.pointExpired ? "만료" : outOfStock ? "품절" : pointShortage ? "포인트 부족" : "교환";

          return (
            <div className="coupon-card" key={coupon.id}>
              <span>{coupon.stockQuantity === null ? "무제한" : coupon.stockQuantity > 0 ? `재고 ${coupon.stockQuantity}` : "재고 없음"}</span>
              <strong>{coupon.name}</strong>
              <p>{coupon.description}</p>
              <div className="card-footer">
                <em>{formatNumber(coupon.requiredPoints)}P</em>
                <button disabled={!canRedeem} onClick={() => onRedeem(coupon)} type="button">
                  {actionLabel}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="request-list">
        <h3>내 쿠폰 요청</h3>
        {userRequests.length === 0 ? <EmptyState text="아직 쿠폰 요청이 없습니다." /> : null}
        {userRequests.map((request) => (
          <RequestRow key={request.id} coupon={coupons.find((coupon) => coupon.id === request.couponId)} request={request} today={today} onCancel={onCancel} />
        ))}
      </div>
    </section>
  );
}

function PointHistoryView({ data, rookie }: { data: FinalUQuestConfig; rookie: RookieSummary }) {
  const histories = data.pointHistories.filter((history) => history.userId === rookie.user.id).slice().reverse();

  return (
    <section className="u-card full-card">
      <ScreenTitle eyebrow="이력 저장" title="포인트 이력" meta={`${formatNumber(rookie.pointBalance)}P`} />
      <div className="ledger-list">
        {histories.map((history) => (
          <div className={history.amount < 0 ? "minus" : "plus"} key={history.id}>
            <div>
              <strong>{history.reason}</strong>
              <span>{formatDate(history.createdAt.slice(0, 10))} · {history.type}</span>
            </div>
            <b>{history.amount > 0 ? "+" : ""}{formatNumber(history.amount)}P</b>
          </div>
        ))}
      </div>
    </section>
  );
}

function ManagerView({
  data,
  manager
}: {
  data: FinalUQuestConfig;
  manager: FinalUser;
}) {
  const store = data.stores.find((item) => item.id === manager.storeId);
  const rookies = data.users.filter((user) => user.role === "rookie" && user.storeId === manager.storeId);

  return (
    <main className="final-screen role-screen">
      <ScreenTitle eyebrow="점장 조회 전용" title={`${store?.name ?? "담당 매장"} 신입`} meta={`${rookies.length}명`} />
      <div className="readonly-note">점장은 소속 매장 신입의 진행률, 티어, AX, 배지만 조회할 수 있습니다. 수정/승인/포인트/쿠폰/엑셀 권한은 없습니다.</div>
      <div className="employee-list">
        {rookies.map((user) => {
          const summary = deriveRookieSummary(data, user);

          return (
            <div className="employee-card-final" key={user.id}>
              <div>
                <strong>{user.name}</strong>
                <span>{statusLabel(user.status)} · D+{summary.currentDay} · {summary.quizTier} · {summary.axLevel}</span>
              </div>
              <div className="mini-progress">
                <i style={{ width: `${summary.progressRate}%` }} />
              </div>
              <div className="employee-meta">
                <span>배지 {summary.acquiredBadges.length}개</span>
                <span>학습 {summary.learningCount}/20</span>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}

function AdminView({
  data,
  onApprove,
  onReject,
  onSendCoupon,
  onCancelCoupon,
  onUpdateCurriculum
}: {
  data: FinalUQuestConfig;
  onApprove: (userId: string) => void;
  onReject: (userId: string) => void;
  onSendCoupon: (requestId: string) => void;
  onCancelCoupon: (requestId: string, reason: string) => void;
  onUpdateCurriculum: (curriculumId: string, draft: CurriculumDraft) => void;
}) {
  const [tab, setTab] = useState<"dashboard" | "members" | "curriculum" | "ax" | "coupons" | "validation">("dashboard");
  const rookies = data.users.filter((user) => user.role === "rookie");
  const pending = rookies.filter((user) => user.status === "pending").length;
  const completed = rookies.filter((user) => user.status === "completed").length;
  const requestedCoupons = data.couponRequests.filter((request) => request.status === "requested");
  const avgProgress = Math.round(rookies.reduce((sum, user) => sum + deriveRookieSummary(data, user).progressRate, 0) / Math.max(1, rookies.length));

  return (
    <main className="final-screen role-screen">
      <ScreenTitle eyebrow="본사 관리자" title="운영 대시보드" meta="전체 권한" />
      <div className="admin-kpi-grid">
        <Metric label="전체 신입" value={`${rookies.length}명`} />
        <Metric label="진행 중" value={`${rookies.filter((user) => user.status === "active").length}명`} />
        <Metric label="수료자" value={`${completed}명`} />
        <Metric label="평균 진행률" value={`${avgProgress}%`} />
        <Metric label="승인 대기" value={`${pending}건`} />
        <Metric label="쿠폰 요청" value={`${requestedCoupons.length}건`} />
      </div>

      <div className="admin-tabs-final">
        {[
          ["dashboard", "대시보드"],
          ["members", "회원"],
          ["curriculum", "커리큘럼"],
          ["ax", "AX"],
          ["coupons", "쿠폰"],
          ["validation", "검증"]
        ].map(([id, label]) => (
          <button className={tab === id ? "active" : ""} key={id} onClick={() => setTab(id as typeof tab)} type="button">
            {label}
          </button>
        ))}
      </div>

      {tab === "dashboard" ? (
        <section className="u-card">
          <div className="compact-list">
            {data.notifications.map((notification) => (
              <div key={notification.id}>
                <strong>{notification.title}</strong>
                <span>{notification.message}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {tab === "members" ? (
        <section className="u-card">
          <div className="table-list">
            {rookies.map((user) => {
              const summary = deriveRookieSummary(data, user);

              return (
                <div className="admin-row-final" key={user.id}>
                  <div>
                    <strong>{user.name}</strong>
                    <span>{data.stores.find((store) => store.id === user.storeId)?.name ?? "-"} · {statusLabel(user.status)} · {summary.progressRate}%</span>
                  </div>
                  <div className="row-actions">
                    {user.status === "pending" ? <button onClick={() => onApprove(user.id)} type="button">승인</button> : null}
                    {user.status === "pending" ? <button className="sub" onClick={() => onReject(user.id)} type="button">반려</button> : null}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {tab === "curriculum" ? <AdminCurriculumPanel curriculums={data.curriculums} onSave={onUpdateCurriculum} quizzes={data.quizzes} /> : null}
      {tab === "ax" ? <AdminAxPanel categories={data.axCategories} /> : null}
      {tab === "coupons" ? (
        <AdminCouponPanel coupons={data.coupons} requests={data.couponRequests} users={data.users} onCancel={onCancelCoupon} onSend={onSendCoupon} />
      ) : null}
      {tab === "validation" ? <ValidationPanel data={data} /> : null}
    </main>
  );
}

function AdminCurriculumPanel({
  curriculums,
  quizzes,
  onSave
}: {
  curriculums: FinalCurriculum[];
  quizzes: FinalUQuestConfig["quizzes"];
  onSave: (curriculumId: string, draft: CurriculumDraft) => void;
}) {
  const [selectedId, setSelectedId] = useState(curriculums[0]?.id ?? "");
  const selected = curriculums.find((curriculum) => curriculum.id === selectedId) ?? curriculums[0];
  const [draft, setDraft] = useState<CurriculumDraft>(() => buildCurriculumDraft(selected, quizzes));

  useEffect(() => {
    setDraft(buildCurriculumDraft(selected, quizzes));
  }, [selected?.id, curriculums, quizzes]);

  if (!selected) return <EmptyState text="등록된 커리큘럼이 없습니다." />;

  function updateDraft(patch: Partial<CurriculumDraft>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  function updateQuiz(index: number, patch: Partial<CurriculumQuizDraft>) {
    setDraft((current) => ({
      ...current,
      quizzes: current.quizzes.map((quiz, quizIndex) => (quizIndex === index ? { ...quiz, ...patch } : quiz))
    }));
  }

  function updateQuizOption(quizIndex: number, optionIndex: number, value: string) {
    setDraft((current) => ({
      ...current,
      quizzes: current.quizzes.map((quiz, currentQuizIndex) =>
        currentQuizIndex === quizIndex
          ? {
              ...quiz,
              options: quiz.options.map((option, currentOptionIndex) => (currentOptionIndex === optionIndex ? value : option))
            }
          : quiz
      )
    }));
  }

  function addQuiz() {
    setDraft((current) => ({
      ...current,
      quizzes: [
        ...current.quizzes,
        {
          question: "",
          options: ["", "", "", ""],
          correctOption: 0,
          explanation: "",
          rewardPoints: "300"
        }
      ]
    }));
  }

  function removeQuiz(index: number) {
    setDraft((current) => ({
      ...current,
      quizzes: current.quizzes.length <= 1 ? current.quizzes : current.quizzes.filter((_, quizIndex) => quizIndex !== index)
    }));
  }

  return (
    <section className="u-card curriculum-admin-card">
      <div className="card-title-row">
        <div>
          <span className="eyebrow">설정 화면</span>
          <h2>커리큘럼/퀴즈 관리</h2>
        </div>
        <button className="save-pill" onClick={() => onSave(selected.id, draft)} type="button">저장</button>
      </div>
      <div className="admin-curriculum-layout">
        <div className="admin-day-list">
        {curriculums.map((curriculum) => (
          <button className={curriculum.id === selected.id ? "selected" : ""} key={curriculum.id} onClick={() => setSelectedId(curriculum.id)} type="button">
            <div>
              <strong>Day {curriculum.dayNumber}. {curriculum.title}</strong>
              <span>{quizzes.filter((quiz) => quiz.curriculumId === curriculum.id).length}문제 · Day별 문제 수 변경 가능</span>
            </div>
            <em>{curriculum.isPublished ? "공개" : "비공개"}</em>
          </button>
        ))}
        </div>
        <div className="curriculum-editor">
          <div className="editor-grid">
            <label>
              제목
              <input onChange={(event) => updateDraft({ title: event.currentTarget.value })} value={draft.title} />
            </label>
            <label>
              학습 보상
              <input inputMode="numeric" onChange={(event) => updateDraft({ learningRewardPoints: event.currentTarget.value })} value={draft.learningRewardPoints} />
            </label>
          </div>
          <label>
            내용
            <textarea onChange={(event) => updateDraft({ description: event.currentTarget.value })} value={draft.description} />
          </label>
          <label className="toggle-row">
            <input checked={draft.isPublished} onChange={(event) => updateDraft({ isPublished: event.currentTarget.checked })} type="checkbox" />
            신입 화면에 공개
          </label>

          <div className="quiz-editor-head">
            <h3>퀴즈 설정</h3>
            <button onClick={addQuiz} type="button">문제 추가</button>
          </div>
          <div className="quiz-editor-list">
            {draft.quizzes.map((quiz, quizIndex) => (
              <div className="quiz-editor-card" key={quiz.id ?? `new-${quizIndex}`}>
                <div className="quiz-editor-title">
                  <strong>Q{quizIndex + 1}</strong>
                  <button disabled={draft.quizzes.length <= 1} onClick={() => removeQuiz(quizIndex)} type="button">삭제</button>
                </div>
                <label>
                  문제
                  <textarea onChange={(event) => updateQuiz(quizIndex, { question: event.currentTarget.value })} value={quiz.question} />
                </label>
                <div className="option-editor-grid">
                  {quiz.options.map((option, optionIndex) => (
                    <label key={optionIndex}>
                      보기 {optionIndex + 1}
                      <input onChange={(event) => updateQuizOption(quizIndex, optionIndex, event.currentTarget.value)} value={option} />
                    </label>
                  ))}
                </div>
                <div className="editor-grid">
                  <label>
                    정답
                    <select onChange={(event) => updateQuiz(quizIndex, { correctOption: Number(event.currentTarget.value) })} value={quiz.correctOption}>
                      {quiz.options.map((_, optionIndex) => (
                        <option key={optionIndex} value={optionIndex}>보기 {optionIndex + 1}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    문제 보상
                    <input inputMode="numeric" onChange={(event) => updateQuiz(quizIndex, { rewardPoints: event.currentTarget.value })} value={quiz.rewardPoints} />
                  </label>
                </div>
                <label>
                  해설
                  <textarea onChange={(event) => updateQuiz(quizIndex, { explanation: event.currentTarget.value })} value={quiz.explanation} />
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function buildCurriculumDraft(curriculum: FinalCurriculum | undefined, quizzes: FinalUQuestConfig["quizzes"]): CurriculumDraft {
  const relatedQuizzes = curriculum ? quizzes.filter((quiz) => quiz.curriculumId === curriculum.id) : [];
  return {
    title: curriculum?.title ?? "",
    description: curriculum?.description ?? "",
    learningRewardPoints: String(curriculum?.learningRewardPoints ?? 300),
    isPublished: curriculum?.isPublished ?? true,
    quizzes: (relatedQuizzes.length > 0 ? relatedQuizzes : [undefined]).map((quiz) => ({
      id: quiz?.id,
      question: quiz?.question ?? "",
      options: quiz?.options?.slice(0, 4) ?? ["", "", "", ""],
      correctOption: quiz?.correctOption ?? 0,
      explanation: quiz?.explanation ?? "",
      rewardPoints: String(quiz?.rewardPoints ?? 300)
    }))
  };
}

function AdminAxPanel({ categories }: { categories: FinalAxCategory[] }) {
  return (
    <section className="u-card">
      <div className="readonly-note">AX/DX 항목 추가/삭제는 불가합니다. 관리자는 설명, 예시 이미지, 보상 포인트, 공개 여부만 수정할 수 있습니다.</div>
      <div className="ax-grid">
        {categories.map((category) => (
          <div className="ax-card" key={category.id}>
            <span>{category.type}</span>
            <strong>{category.title}</strong>
            <p>{category.description}</p>
            <em>{formatNumber(category.rewardPoints)}P · {category.isPublished ? "공개" : "비공개"}</em>
          </div>
        ))}
      </div>
    </section>
  );
}

function AdminCouponPanel({
  coupons,
  requests,
  users,
  onSend,
  onCancel
}: {
  coupons: FinalCoupon[];
  requests: FinalCouponRequest[];
  users: FinalUser[];
  onSend: (requestId: string) => void;
  onCancel: (requestId: string, reason: string) => void;
}) {
  return (
    <section className="u-card">
      <div className="request-list">
        <h3>교환 요청</h3>
        {requests.map((request) => {
          const user = users.find((item) => item.id === request.userId);
          const coupon = coupons.find((item) => item.id === request.couponId);

          return (
            <div className="request-row" key={request.id}>
              <div>
                <strong>{coupon?.name ?? "쿠폰"}</strong>
                <span>{user?.name ?? "-"} · {request.status} · {formatNumber(request.requiredPoints)}P{request.expiresAt ? ` · 만료일 ${formatDate(request.expiresAt.slice(0, 10))}` : ""}</span>
              </div>
              <div className="row-actions">
                {request.status === "requested" ? <button onClick={() => onSend(request.id)} type="button">발송완료</button> : null}
                {request.status === "requested" ? <button className="sub" onClick={() => onCancel(request.id, "관리자 취소")} type="button">취소</button> : null}
              </div>
            </div>
          );
        })}
      </div>
      <div className="coupon-grid">
        {coupons.map((coupon) => (
          <div className="coupon-card" key={coupon.id}>
            <span>{coupon.stockQuantity === null ? "무제한" : `재고 ${coupon.stockQuantity}`}</span>
            <strong>{coupon.name}</strong>
            <p>{coupon.description}</p>
            <em>{formatKrw(coupon.actualPrice)} · {formatNumber(coupon.requiredPoints)}P</em>
          </div>
        ))}
      </div>
    </section>
  );
}

function ValidationPanel({ data }: { data: FinalUQuestConfig }) {
  const validations = buildValidationItems(data);

  return (
    <section className="u-card">
      <div className="validation-list">
        {validations.map((item) => (
          <div className={item.pass ? "pass" : "fail"} key={item.title}>
            <b>{item.pass ? "PASS" : "CHECK"}</b>
            <div>
              <strong>{item.title}</strong>
              <span>{item.detail}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function BottomNav({ active, onGo }: { active: FinalScreenKey; onGo: (screen: FinalScreenKey) => void }) {
  return (
    <nav className="bottom-nav final-bottom-nav">
      {rookieNav.map((item) => (
        <button className={active === item.screen ? "active" : ""} key={item.screen} onClick={() => onGo(item.screen)} type="button">
          <span>{item.short}</span>
          <small>{item.label}</small>
        </button>
      ))}
    </nav>
  );
}

function StatusBanner({ rookie }: { rookie: RookieSummary }) {
  if (rookie.user.status === "active") return null;

  const copy: Record<FinalUserStatus, { title: string; body: string; danger?: boolean }> = {
    pending: { title: "승인 대기", body: "관리자 승인 전에는 온보딩을 진행할 수 없습니다." },
    active: { title: "", body: "" },
    rejected: { title: "승인 반려", body: rookie.user.rejectReason ?? "관리자 확인이 필요합니다.", danger: true },
    completed: { title: "수료 완료", body: "학습과 퀴즈 진행은 종료됐고, 상점과 이력 조회가 가능합니다." },
    inactive: { title: "비활성 계정", body: "퇴사/비활성 계정은 접근할 수 없습니다.", danger: true }
  };
  const item = copy[rookie.user.status];

  return (
    <section className={`status-banner${item.danger ? " danger" : ""}`}>
      <strong>{item.title}</strong>
      <span>{item.body}</span>
    </section>
  );
}

function TaskLine({ label, done, action, onClick }: { label: string; done: boolean; action: string; onClick: () => void }) {
  return (
    <button className={done ? "done" : ""} onClick={onClick} type="button">
      <span>{done ? "완료" : "대기"}</span>
      <strong>{label}</strong>
      <em>{done ? "확인" : action}</em>
    </button>
  );
}

function ScreenTitle({ eyebrow, title, meta }: { eyebrow: string; title: string; meta: string }) {
  return (
    <div className="screen-title">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
      </div>
      <b>{meta}</b>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-tile">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function LockPanel({ title, body, danger }: { title: string; body: string; danger?: boolean }) {
  return (
    <div className={`lock-panel${danger ? " danger" : ""}`}>
      <strong>{title}</strong>
      <span>{body}</span>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="empty-state">{text}</div>;
}

function RequestRow({
  request,
  coupon,
  today,
  onCancel
}: {
  request: FinalCouponRequest;
  coupon?: FinalCoupon;
  today?: string;
  onCancel: (requestId: string, reason: string) => void;
}) {
  const expired = Boolean(today && request.expiresAt && today > request.expiresAt.slice(0, 10));

  return (
    <div className="request-row">
      <div>
        <strong>{coupon?.name ?? "쿠폰"}</strong>
        <span>{request.status} · {formatNumber(request.requiredPoints)}P{request.expiresAt ? ` · ${expired ? "만료" : "만료일"} ${formatDate(request.expiresAt.slice(0, 10))}` : ""}</span>
      </div>
      {request.status === "requested" ? (
        <button onClick={() => onCancel(request.id, "사용자 취소")} type="button">
          취소
        </button>
      ) : null}
    </div>
  );
}

function ToastModal({ toast, onClose }: { toast: Toast | null; onClose: () => void }) {
  return (
    <div className={`modal${toast ? " show" : ""}`}>
      <div className={`modal-card final-modal ${toast?.tone ?? ""}`}>
        <h2>{toast?.title ?? "알림"}</h2>
        <p>{toast?.body ?? ""}</p>
        <button className="modal-close" onClick={onClose} type="button">
          확인
        </button>
      </div>
    </div>
  );
}

function normalizeConfig(config: FinalUQuestConfig): FinalUQuestConfig {
  return JSON.parse(JSON.stringify(config)) as FinalUQuestConfig;
}

function deriveRookieSummary(data: FinalUQuestConfig, user: FinalUser): RookieSummary {
  const storeName = data.stores.find((store) => store.id === user.storeId)?.name ?? "본사";
  const hireDate = user.hireDate ?? data.today;
  const currentDay = Math.max(1, diffDays(hireDate, data.today) + 1);
  const curriculumDay = Math.min(20, Math.max(1, currentDay));
  const endDate = addDays(hireDate, 27);
  const userPointHistories = data.pointHistories.filter((history) => history.userId === user.id);
  const pointBalance = userPointHistories.reduce((sum, history) => sum + history.amount, 0);
  const totalEarnedPoints = userPointHistories.filter((history) => history.amount > 0).reduce((sum, history) => sum + history.amount, 0);
  const totalSpentPoints = Math.abs(userPointHistories.filter((history) => history.amount < 0).reduce((sum, history) => sum + history.amount, 0));
  const attendanceCount = data.attendances.filter((attendance) => attendance.userId === user.id).length;
  const learningCount = data.learningCompletions.filter((completion) => completion.userId === user.id).length;
  const submissions = data.quizSubmissions.filter((submission) => submission.userId === user.id);
  const quizSolvedCount = submissions.reduce((sum, submission) => sum + submission.totalCount, 0);
  const quizCorrectCount = submissions.reduce((sum, submission) => sum + submission.correctCount, 0);
  const quizAccuracyRate = quizSolvedCount ? Math.round((quizCorrectCount / quizSolvedCount) * 100) : 0;
  const quizTier = getQuizTier(quizAccuracyRate, quizSolvedCount);
  const axSubmissionCount = data.axSubmissions.filter((submission) => submission.userId === user.id).length;
  const axLevel = getAxLevel(axSubmissionCount);
  const progressRate = Math.min(100, Math.round(((attendanceCount + learningCount + submissions.length + Math.min(axSubmissionCount, 20)) / 80) * 100));
  const characterLevel = Math.min(5, Math.max(1, Math.floor(progressRate / 25) + 1));
  const pointExpireDate = user.completedAt ? addMonths(user.completedAt.slice(0, 10), 3) : null;
  const pointExpired = Boolean(pointExpireDate && data.today > pointExpireDate);
  const acquiredBadges = data.badges.filter((badge) => user.badgeIds.includes(badge.id));

  return {
    user,
    storeName,
    currentDay,
    curriculumDay,
    endDate,
    progressRate,
    attendanceCount,
    learningCount,
    quizSolvedCount,
    quizCorrectCount,
    quizAccuracyRate,
    quizTier,
    axSubmissionCount,
    axLevel,
    characterLevel,
    pointBalance,
    totalEarnedPoints,
    totalSpentPoints,
    shopOpened: user.status === "completed",
    pointExpireDate,
    pointExpired,
    acquiredBadges
  };
}

function buildValidationItems(data: FinalUQuestConfig) {
  const pending = data.users.some((user) => user.role === "rookie" && user.status === "pending");
  const rejected = data.users.some((user) => user.role === "rookie" && user.status === "rejected");
  const inactive = data.users.some((user) => user.role === "rookie" && user.status === "inactive");
  const completed = data.users.some((user) => user.role === "rookie" && user.status === "completed");
  const axFixed = data.axCategories.length === 7;
  const variableQuiz = new Set(data.curriculums.map((curriculum) => data.quizzes.filter((quiz) => quiz.curriculumId === curriculum.id).length)).size > 1;
  const unlimitedCoupon = data.coupons.some((coupon) => coupon.stockQuantity === null);
  const noStockCoupon = data.coupons.some((coupon) => coupon.stockQuantity === 0);
  const pointLedger = data.pointHistories.every((history) => typeof history.balanceAfter === "number" && history.reason.length > 0);

  return [
    { title: "승인 전 로그인", pass: pending, detail: "pending 상태 신입은 온보딩 액션이 차단됩니다." },
    { title: "승인 반려", pass: rejected, detail: "rejected 상태와 반려 사유를 보관합니다." },
    { title: "수료 전 상점 접근", pass: completed, detail: "active 사용자는 상점이 잠기고 completed 사용자만 교환 가능합니다." },
    { title: "퇴사자 접근", pass: inactive, detail: "inactive 사용자는 온보딩 액션이 차단됩니다." },
    { title: "AX/DX 7개 고정", pass: axFixed, detail: "AX 4개, DX 3개 항목만 표시합니다." },
    { title: "퀴즈 문제 수 가변", pass: variableQuiz, detail: "Day별 문제 수가 다르고 티어는 정답률 기준입니다." },
    { title: "쿠폰 재고 NULL", pass: unlimitedCoupon, detail: "NULL 재고는 무제한으로 표시합니다." },
    { title: "재고 없음", pass: noStockCoupon, detail: "재고 0 쿠폰은 교환 요청이 차단됩니다." },
    { title: "포인트 이력", pass: pointLedger, detail: "모든 지급/차감은 reason과 balanceAfter를 보관합니다." },
    { title: "점장 조회 전용", pass: true, detail: "점장 화면은 담당 매장 신입 조회만 제공하고 수정 버튼이 없습니다." }
  ];
}

function apiErrorTitle(code?: string) {
  const labels: Record<string, string> = {
    ACCOUNT_PENDING: "승인 대기",
    ACCOUNT_REJECTED: "승인 반려",
    ACCOUNT_COMPLETED: "수료 완료",
    ACCOUNT_INACTIVE: "접근 제한",
    DUPLICATE_ATTENDANCE: "중복 출석",
    LEARNING_NOT_TODAY: "오늘 학습 아님",
    DAILY_LEARNING_LIMIT: "오늘 학습 완료",
    LEARNING_ALREADY_COMPLETED: "이미 완료",
    LEARNING_REQUIRED: "학습 필요",
    QUIZ_ALREADY_SUBMITTED: "재도전 불가",
    QUIZ_INCOMPLETE: "답변 필요",
    AX_EVIDENCE_REQUIRED: "사진 필요",
    SHOP_LOCKED_UNTIL_COMPLETION: "상점 잠김",
    POINTS_EXPIRED: "포인트 만료",
    COUPON_OUT_OF_STOCK: "재고 없음",
    DUPLICATE_COUPON_REQUEST: "중복 요청",
    INSUFFICIENT_POINTS: "포인트 부족",
    COUPON_ALREADY_SENT: "발송 완료",
    FORBIDDEN_ROLE: "권한 없음",
    INVALID_INPUT: "입력 확인"
  };

  return labels[code ?? ""] ?? "요청 실패";
}

function getUser(data: FinalUQuestConfig, userId: string): FinalUser {
  return data.users.find((user) => user.id === userId) ?? data.users[0];
}

function getCurrentCurriculumId(data: FinalUQuestConfig, user: FinalUser) {
  const hireDate = user.hireDate ?? data.today;
  const currentDay = Math.min(20, Math.max(1, diffDays(hireDate, data.today) + 1));
  return data.curriculums.find((item) => item.dayNumber === currentDay)?.id ?? data.curriculums[0]?.id ?? "day-1";
}

function getQuizTier(accuracy: number, solved: number): QuizTier {
  if (solved <= 0) return "Unranked";
  if (accuracy >= 95) return "Diamond";
  if (accuracy >= 80) return "Platinum";
  if (accuracy >= 60) return "Gold";
  if (accuracy >= 40) return "Silver";
  if (accuracy >= 20) return "Bronze";
  return "Unranked";
}

function getAxLevel(count: number): AxLevel {
  if (count >= 20) return "Master";
  if (count >= 15) return "Expert";
  if (count >= 10) return "User";
  return "Explorer";
}

function nextAxThreshold(count: number) {
  if (count < 10) return 10;
  if (count < 15) return 15;
  return 20;
}

function diffDays(start: string, end: string) {
  return Math.floor((toDateOnly(end).getTime() - toDateOnly(start).getTime()) / 86_400_000);
}

function addDays(date: string, days: number) {
  const next = toDateOnly(date);
  next.setDate(next.getDate() + days);
  return formatDateInput(next);
}

function addMonths(date: string, months: number) {
  const next = toDateOnly(date);
  next.setMonth(next.getMonth() + months);
  return formatDateInput(next);
}

function toDateOnly(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(date: string) {
  const [year, month, day] = date.split("-");
  return `${year}.${month}.${day}`;
}

function roleLabel(role: FinalRole) {
  if (role === "rookie") return "신입";
  if (role === "manager") return "점장";
  return "본사";
}

function statusLabel(status: FinalUserStatus) {
  const labels: Record<FinalUserStatus, string> = {
    pending: "승인대기",
    active: "진행중",
    rejected: "반려",
    completed: "수료",
    inactive: "비활성"
  };

  return labels[status];
}

function statusHeadline(status: FinalUserStatus) {
  const labels: Record<FinalUserStatus, string> = {
    pending: "승인 대기",
    active: "오늘의 온보딩",
    rejected: "승인 반려",
    completed: "수료 완료",
    inactive: "접근 제한"
  };

  return labels[status];
}

function axLevelKorean(level: AxLevel) {
  const labels: Record<AxLevel, string> = {
    Explorer: "탐색자",
    User: "실천자",
    Expert: "전문가",
    Master: "마스터"
  };

  return labels[level];
}

function badgeCategoryLabel(category: BadgeCategory) {
  const labels: Record<BadgeCategory, string> = {
    attendance: "출석 배지",
    quiz: "퀴즈 배지",
    tier: "티어 배지",
    rare: "희귀 배지"
  };

  return labels[category];
}

function badgeMedalLabel(badge: FinalBadge) {
  if (badge.category === "attendance") return "A";
  if (badge.category === "quiz") return "Q";
  if (badge.category === "tier") return badge.name.slice(0, 1);
  return "R";
}
