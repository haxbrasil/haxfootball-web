import { LoginBrandPanel } from "./components/login-brand-panel";
import { LoginMethodCard } from "./components/login-method-card";

export function LoginPage() {
  return (
    <section className="-mx-4 -my-6 min-h-[calc(100vh-4rem)] px-4 py-8 sm:py-10 lg:h-[calc(100vh-5rem)] lg:min-h-0 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-9rem)] w-full max-w-6xl items-center gap-8 lg:h-full lg:min-h-0 lg:grid-cols-[1fr_26rem]">
        <div className="order-2 lg:order-1">
          <LoginBrandPanel />
        </div>
        <div className="order-1 lg:order-2">
          <LoginMethodCard />
        </div>
      </div>
    </section>
  );
}
