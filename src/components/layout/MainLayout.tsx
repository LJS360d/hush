import P2PTroubleshoot from "@/components/troubleshoot/P2PTroubleshoot";
import { useTranslate } from "@/i18n/useTranslate";
import { $connectionError } from "@/stores/peer.store"; // Assuming it was added here
import { useStore } from "@nanostores/solid";
import { TbPlugConnectedX } from "solid-icons/tb";
import { onMount, type ParentComponent } from "solid-js";

const THEMES = [
  {
    group: "Dark",
    options: [
      "dark",
      "black",
      "dracula",
      "halloween",
      "synthwave",
      "dim",
      "business",
      "luxury",
    ],
  },
  {
    group: "Light",
    options: [
      "light",
      "garden",
      "forest",
      "fantasy",
      "emerald",
      "pastel",
      "cupcake",
      "lofi",
      "corporate",
      "bumblebee",
      "cmyk",
      "valentine",
      "wireframe",
      "winter",
    ],
  },
  {
    group: "Extra",
    options: [
      "retro",
      "aqua",
      "acid",
      "cyberpunk",
      "coffee",
      "autumn",
      "lemonade",
      "nord",
      "sunset",
      "caramellatte",
      "abyss",
      "silk",
    ],
  },
];

const MainLayout: ParentComponent = (props) => {
  const t = useTranslate();
  let selectRef: HTMLSelectElement | undefined;
  let modalRef: HTMLDialogElement | undefined;

  const connectionError = useStore($connectionError);

  onMount(() => {
    // Initialize theme from localStorage
    const savedTheme = localStorage.getItem("daisyui-theme") ?? "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);
    if (selectRef) selectRef.value = savedTheme;

    // Listen for connection errors to show the modal
    const unsubscribe = $connectionError.subscribe((error) => {
      if (error && modalRef) {
        modalRef.showModal();
      }
    });

    return unsubscribe;
  });

  const handleThemeChange = (e: Event) => {
    const theme = (e.target as HTMLSelectElement).value;
    localStorage.setItem("daisyui-theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
  };

  const closeTroubleshooter = () => {
    $connectionError.set(null);
    if (modalRef) modalRef.close();
  };

  const baseUrl = import.meta.env.BASE_URL;

  return (
    <div class="bg-base-100 min-h-screen flex flex-col font-sans">
      <header class="bg-base-200 border-b border-zinc-800 p-4">
        <nav class="max-w-8xl mx-auto flex justify-between items-center">
          <a
            href={`/${baseUrl}`}
            class="text-2xl font-black tracking-tighter text-secondary hover:opacity-80 transition"
          >
            HUSH<span class="text-zinc-500 text-sm">.online</span>
          </a>

          <div class="flex gap-4 items-center">
            <span
              class="hover:underline text-sm cursor-pointer text-zinc-500"
              onClick={() => {
                modalRef?.showModal();
              }}
            >
              {t("troubleshoot.title")}
            </span>
            <select
              ref={selectRef}
              onChange={handleThemeChange}
              class="select select-bordered select-sm w-fit capitalize"
            >
              {THEMES.map((group) => (
                <optgroup label={group.group}>
                  {group.options.map((theme) => (
                    <option value={theme}>{theme}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </nav>
      </header>

      <main class="grow flex flex-col max-w-8xl mx-auto w-full my-8 px-4">
        {props.children}
      </main>

      {/* Global Connection Troubleshooting Modal */}
      <dialog ref={modalRef} class="modal modal-bottom sm:modal-middle">
        <div class="modal-box max-w-4xl p-0 overflow-hidden border border-white/10 shadow-2xl">
          <div class="bg-error text-error-content p-6 flex items-center gap-4 relative">
            <TbPlugConnectedX size={40} />
            <div>
              <h3 class="text-2xl font-black uppercase italic leading-none">
                {t("troubleshoot.title")}
              </h3>
              <p class="text-sm font-bold opacity-80 mt-1">
                {connectionError() === "nat_failure"
                  ? t("troubleshoot.detection.nat_fail")
                  : t("troubleshoot.subtitle")}
              </p>
            </div>
            <div class="absolute right-2 top-0">
              <button
                class="text-3xl cursor-pointer hover:font-bold transition-all"
                onClick={closeTroubleshooter}
              >
                &times;
              </button>
            </div>
          </div>

          <div class="p-6 bg-base-100">
            {/* P2PTroubleshoot component: Ensure the component you generated
              earlier is exported as default in P2PTroubleshoot.tsx
            */}
            <P2PTroubleshoot />

            <div class="modal-action mt-8">
              <button
                class="btn btn-outline font-bold"
                onClick={closeTroubleshooter}
              >
                {t("common.close")}
              </button>
            </div>
          </div>
        </div>
        <form
          method="dialog"
          class="modal-backdrop bg-black/60 backdrop-blur-sm"
        >
          <button onClick={closeTroubleshooter} />
        </form>
      </dialog>

      <footer class="bg-base-200 border-t border-zinc-900 p-6 text-center text-zinc-600 text-sm">
        <p>© {new Date().getFullYear()} Hush. All rights reserved.</p>
        <p class="mt-2 text-xs opacity-70">
          Unaffiliated with any third-party brands.
        </p>
      </footer>
    </div>
  );
};

export default MainLayout;
