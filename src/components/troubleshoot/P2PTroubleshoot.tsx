import { createSignal, For } from "solid-js";
import { useTranslate } from "@/i18n/useTranslate";
import {
  TbPlugConnectedX,
  TbShieldLock,
  TbGlobe,
  TbDeviceDesktop,
  TbRefresh,
} from "solid-icons/tb";

export default function P2PTroubleshoot() {
  const t = useTranslate();
  const [isOpen, setIsOpen] = createSignal(true);

  const steps = [
    {
      title: t("troubleshoot.steps.vpn.title"),
      desc: t("troubleshoot.steps.vpn.desc"),
      icon: <TbShieldLock class="text-warning" size={24} />,
    },
    {
      title: t("troubleshoot.steps.browser.title"),
      desc: t("troubleshoot.steps.browser.desc"),
      icon: <TbGlobe class="text-info" size={24} />,
    },
    {
      title: t("troubleshoot.steps.nat.title"),
      desc: t("troubleshoot.steps.nat.desc"),
      icon: <TbDeviceDesktop class="text-success" size={24} />,
    },
    {
      title: t("troubleshoot.steps.refresh.title"),
      desc: t("troubleshoot.steps.refresh.desc"),
      icon: <TbRefresh class="text-primary" size={24} />,
    },
  ];

  return (
    <div class="w-full mt-12 max-w-4xl mx-auto">
      <div class="collapse collapse-arrow bg-base-200 border border-base-300 shadow-sm">
        <input
          type="checkbox"
          checked={isOpen()}
          onChange={() => setIsOpen(!isOpen())}
        />

        <div class="collapse-title flex items-center gap-4 p-6">
          <div class="p-2 bg-error/10 rounded-lg">
            <TbPlugConnectedX size={28} class="text-error" />
          </div>
          <div>
            <h3 class="text-lg font-black uppercase tracking-tight">
              {t("troubleshoot.title")}
            </h3>
            <p class="text-xs opacity-60 font-medium">
              {t("troubleshoot.subtitle")}
            </p>
          </div>
        </div>

        <div class="collapse-content px-6 pb-6">
          <div class="divider mt-0"></div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <For each={steps}>
              {(step) => (
                <div class="flex gap-4 p-4 bg-base-100 rounded-xl border border-base-content/5 shadow-inner">
                  <div class="shrink-0 mt-1">{step.icon}</div>
                  <div>
                    <h4 class="font-bold text-sm mb-1">{step.title}</h4>
                    <p class="text-xs leading-relaxed opacity-70">
                      {step.desc}
                    </p>
                  </div>
                </div>
              )}
            </For>
          </div>

          <div class="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div class="text-xs italic text-center sm:text-left">
              <strong>{t("troubleshoot.tip.label")}:</strong>{" "}
              {t("troubleshoot.tip.content")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
