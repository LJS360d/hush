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
  let selectRef: HTMLSelectElement | undefined;

  onMount(() => {
    // Initialize theme from localStorage
    const savedTheme = localStorage.getItem("daisyui-theme") ?? "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);
    if (selectRef) selectRef.value = savedTheme;
  });

  const handleThemeChange = (e: Event) => {
    const theme = (e.target as HTMLSelectElement).value;
    localStorage.setItem("daisyui-theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
  };

  return (
    <div class="bg-base-100 min-h-screen flex flex-col font-sans">
      <header class="bg-base-200 border-b border-zinc-800 p-4">
        <nav class="max-w-8xl mx-auto flex justify-between items-center">
          <a
            href="/"
            class="text-2xl font-black tracking-tighter text-secondary hover:opacity-80 transition"
          >
            HUSH<span class="text-zinc-500 text-sm">.online</span>
          </a>

          <div class="flex gap-4 items-center">
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
