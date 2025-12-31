import { useTranslate } from "@/i18n/useTranslate";
import { $avatar, $name, $peer, initPeer } from "@/stores/peer.store";
import { useStore } from "@nanostores/solid";
import { useNavigate } from "@tanstack/solid-router";
import { BiSolidRightArrowCircle } from "solid-icons/bi";
import { FaBrandsDiscord, FaBrandsGithub, FaSolidRotate } from "solid-icons/fa";
import { TbCrown } from "solid-icons/tb";
import { createSignal, For, onCleanup, onMount } from "solid-js";

function InfoCarousel() {
  const t = useTranslate();
  const [currentSlide, setCurrentSlide] = createSignal(0);
  const slides = [
    {
      title: t("home.carousel.quick-play.title"),
      desc: t("home.carousel.quick-play.desc"),
    },
    {
      title: t("home.carousel.custom-rules.title"),
      desc: t("home.carousel.custom-rules.desc"),
    },
    {
      title: t("home.carousel.unlock-avatars.title"),
      desc: t("home.carousel.unlock-avatars.desc"),
    },
    {
      title: t("home.carousel.ranked-mode.title"),
      desc: t("home.carousel.ranked-mode.desc"),
    },
    {
      title: t("home.carousel.community-hub.title"),
      desc: t("home.carousel.community-hub.desc"),
    },
    {
      title: t("home.carousel.global-chat.title"),
      desc: t("home.carousel.global-chat.desc"),
    },
  ];

  const timer = setInterval(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, 5000);

  onCleanup(() => clearInterval(timer));

  return (
    <div class="hidden lg:flex flex-col justify-center items-center w-160 bg-base-200 p-8 rounded-r-xl border-l border-base-300 relative overflow-hidden">
      <div
        class="flex transition-transform duration-700 ease-in-out"
        style={{
          transform: `translateX(-${currentSlide() * 100}%)`,
          width: `${slides.length * 100}%`,
        }}
      >
        <For each={slides}>
          {(slide) => (
            <div class="w-full shrink-0 flex flex-col items-center text-center px-4">
              <div class="w-16 h-16 bg-primary/20 rounded-2xl mb-6 flex items-center justify-center">
                <div class="w-8 h-8 bg-primary rounded-full animate-pulse" />
              </div>
              <h3 class="text-xl font-bold mb-2">{slide.title}</h3>
              <p class="text-sm text-base-content/60 leading-relaxed">
                {slide.desc}
              </p>
            </div>
          )}
        </For>
      </div>

      <div class="flex gap-2 mt-8">
        <For each={slides}>
          {(_, i) => (
            <div
              class={`h-1.5 transition-all duration-300 rounded-full ${
                currentSlide() === i()
                  ? "w-6 bg-primary"
                  : "w-2 bg-base-content/20"
              }`}
            />
          )}
        </For>
      </div>
    </div>
  );
}

function SocialFooter() {
  return (
    <div class="absolute -bottom-12 left-0 right-0 flex justify-center gap-4">
      <a href="#" class="btn btn-circle btn-ghost btn-sm transition">
        <FaBrandsGithub size={20} />
      </a>
      <a href="#" class="btn btn-circle btn-ghost btn-sm  transition">
        <FaBrandsDiscord size={20} />
      </a>
    </div>
  );
}

export default function RoomCreate() {
  const t = useTranslate();
  const navigate = useNavigate();
  const avatar = useStore($avatar);
  const name = useStore($name);
  const peer = useStore($peer);
  // const baseUrl = import.meta.env.BASE_URL;
  const [code, setRoomCode] = createSignal("");
  const [isJoining, setIsJoining] = createSignal(false);

  const handleStart = async () => {
    if (!name() || isJoining()) return;
    setIsJoining(true);

    const urlCode = code() || (await initPeer()).id;
    console.log(urlCode);
    navigate({
      to: "/room",
      search: (prev) => ({
        ...prev,
        code: urlCode,
      }),
    });
  };

  onMount(async () => {
    const params = new URLSearchParams(window.location.search);
    const urlCode = params.get("code");
    setRoomCode(urlCode || (await initPeer()).id);
  });

  return (
    <div class="flex items-center justify-center h-[75svh] p-6 bg-base-300/30">
      <div class="relative w-full max-w-400">
        <div class="card lg:card-side bg-base-100 shadow-2xl min-h-125 overflow-visible border border-base-content/5">
          <div class="flex flex-col items-center justify-center p-12 bg-primary/5 rounded-l-xl space-y-6 border-r border-base-300 min-w-[320px]">
            <div class="avatar relative group">
              <div class="w-48 h-48 rounded-3xl ring-4 ring-primary ring-offset-base-100 ring-offset-4 overflow-hidden bg-base-200 shadow-inner">
                <img
                  src={avatar()}
                  alt="avatar"
                  class="w-full h-full object-cover"
                />
              </div>
              <button
                class="btn btn-primary btn-circle absolute -bottom-4 -right-4 shadow-xl hover:scale-110 transition-transform"
                onClick={() =>
                  $avatar.set(
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`,
                  )
                }
              >
                <FaSolidRotate size={20} />
              </button>
            </div>
            <div class="text-center">
              <span class="badge badge-primary badge-outline font-black tracking-widest p-3">
                {t("home.profile.label")}
              </span>
            </div>
          </div>

          <div class="card-body flex-1 p-12 justify-center">
            <div class="max-w-md mx-auto w-full">
              <header class="mb-10">
                <h2 class="text-5xl font-black italic uppercase tracking-tighter text-primary leading-none">
                  {t("home.title.ready")} <br />{" "}
                  <span class="text-base-content">{t("home.title.slam")}</span>
                </h2>
                <p class="text-base-content/60 mt-4 text-lg">
                  {t("home.subtitle")}
                </p>
              </header>

              <div class="form-control w-full space-y-2">
                <label class="label font-bold text-xs uppercase opacity-50">
                  {t("home.input.nickname")}
                </label>
                <input
                  type="text"
                  placeholder={t("home.input.placeholder")}
                  class="input input-bordered input-lg w-full border-2 focus:border-primary font-bold text-xl h-20 shadow-sm"
                  value={name()}
                  onInput={(e) => $name.set(e.currentTarget.value)}
                />
              </div>

              <div class="card-actions mt-12">
                <button
                  onClick={handleStart}
                  disabled={!name() || isJoining()}
                  class="btn btn-primary btn-lg w-full text-2xl hover:scale-105 font-black italic gap-4 h-20 shadow-[0_8px_0_0_#4a1d96] active:shadow-none active:translate-y-1 transition-all"
                >
                  {t("home.action.start")}
                  <BiSolidRightArrowCircle size={32} />
                </button>
              </div>
            </div>
          </div>

          <InfoCarousel />

          <div class="absolute -top-4 -right-4 badge badge-secondary badge-lg p-6 font-mono font-bold shadow-xl border-2 border-white/10">
            {peer()?.id == code() ? (
              <span class="flex items-center gap-2">
                <TbCrown class="text-yellow-400" size={20} />{" "}
                {t("home.badge.host")}: {code()}
              </span>
            ) : (
              `${t("home.badge.room")}: ${code()}`
            )}
          </div>
        </div>

        <SocialFooter />
      </div>
    </div>
  );
}
