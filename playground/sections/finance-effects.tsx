import { useState, type ReactNode } from "react";
import { useDemoView } from "../demo";
import { BalanceCard } from "../../originals/ui/balance-card";
import { SwapCard } from "../../originals/ui/swap-card";
import { TransactionList, type Transaction } from "../../originals/ui/transaction-list";
import { BudgetBars } from "../../originals/ui/budget-bars";
import { Watchlist, type WatchItem } from "../../originals/ui/watchlist";
import { InvoiceEditor } from "../../originals/ui/invoice-editor";
import { PaymentCard } from "../../originals/ui/payment-card";
import { SpendLimit } from "../../originals/ui/spend-limit";
import { RecurringBills, type Bill } from "../../originals/ui/recurring-bills";
import { AsciiGlobe } from "../../originals/ui/ascii-globe";
import { AsciiText } from "../../originals/ui/ascii-text";
import { AsciiImage } from "../../originals/ui/ascii-image";
import { AsciiField } from "../../originals/ui/ascii-field";
import { AsciiLoader } from "../../originals/ui/ascii-loader";
import { SpotlightCard } from "../../originals/ui/spotlight-card";
import { TextScramble } from "../../originals/ui/text-scramble";
import { ShinyText } from "../../originals/ui/shiny-text";
import { DotField } from "../../originals/ui/dot-field";

function Demo({ title, slug, children }: { title: string; slug: string; children: ReactNode }) {
  const view = useDemoView(slug);
  if (view === "hidden") return null;
  if (view === "bare") return <div data-demo className="col-span-full w-full min-w-0">{children}</div>;
  return (
    <section id={slug} className="grid gap-3">
      <h3 className="text-sm font-medium text-fg-muted">{title}</h3>
      <div className="rounded-[20px] bg-subtle/50 p-6">{children}</div>
    </section>
  );
}

const day = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const TRANSACTIONS: Transaction[] = [
  { id: "1", title: "Corner Cafe", subtitle: "Food and drink", amount: -485, date: day(0) },
  { id: "2", title: "Studio payout", subtitle: "Transfer", amount: 240_000, date: day(-1) },
  { id: "3", title: "Metro pass", subtitle: "Transport", amount: -3200, date: day(-1), status: "pending" },
  { id: "4", title: "Cloud storage", subtitle: "Subscription", amount: -999, date: day(-4), status: "failed" },
];

const WATCH: WatchItem[] = [
  { symbol: "ACME", name: "Acme Industries", price: 18_432, changePct: 1.84, series: [4, 5, 4.6, 6, 6.4, 7.1, 6.8] },
  { symbol: "NOVA", name: "Nova Systems", price: 9_215, changePct: -2.31, series: [8, 7.5, 7.9, 6.8, 6.1, 6.4, 5.6] },
  { symbol: "LUMA", name: "Luma Labs", price: 42_050, changePct: 0.42, series: [5, 5.2, 5.1, 5.4, 5.3, 5.6, 5.5] },
];

const BILLS: Bill[] = [
  { id: "stream", name: "Streaming plan", amount: 1599, frequency: "monthly", nextDue: day(2), autopay: true },
  { id: "rent", name: "Studio rent", amount: 120_000, frequency: "monthly", nextDue: day(6) },
  { id: "cloud", name: "Cloud hosting", amount: 24_000, frequency: "yearly", nextDue: day(21), autopay: true },
];

const LANDSCAPE = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200"><defs><radialGradient id="g" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#000"/></radialGradient></defs><rect width="320" height="200" fill="url(#g)"/><circle cx="220" cy="70" r="34" fill="#fff"/><path d="M0 200 L90 90 L160 160 L240 100 L320 200Z" fill="#555"/></svg>`,
)}`;

export function Section() {
  const [watch, setWatch] = useState(WATCH);
  return (
    <div className="grid gap-10">
      <Demo title="Swap card" slug="swap-card">
        <SwapCard from={{ symbol: "USD", name: "US dollar", decimals: 2 }} to={{ symbol: "EUR", name: "Euro", decimals: 2 }} rate={0.92} balance={125_000} feeBps={30} />
      </Demo>
      <Demo title="Balance card" slug="balance-card">
        <BalanceCard balance={1_284_350} change={42_800} history={[3, 4, 3.6, 5, 4.8, 6.2, 6.9]} actions={<button type="button" className="h-9 rounded-full bg-subtle px-4 text-sm text-fg">Add funds</button>} />
      </Demo>
      <Demo title="Transaction list" slug="transaction-list">
        <TransactionList items={TRANSACTIONS} onSelect={() => {}} />
      </Demo>
      <Demo title="Budget bars" slug="budget-bars">
        <BudgetBars items={[{ id: "food", label: "Food", spent: 41_000, limit: 60_000 }, { id: "travel", label: "Travel", spent: 54_000, limit: 60_000 }, { id: "fun", label: "Entertainment", spent: 31_000, limit: 25_000 }]} />
      </Demo>
      <Demo title="Watchlist" slug="watchlist">
        <Watchlist items={watch} onRemove={(s) => setWatch(watch.filter((w) => w.symbol !== s))} />
      </Demo>
      <Demo title="Invoice editor" slug="invoice-editor">
        <InvoiceEditor defaultTaxPercent={8} defaultValue={[{ id: "1", description: "Brand identity", quantity: 1, unitPrice: 240_000 }, { id: "2", description: "Design review (hours)", quantity: 3.5, unitPrice: 12_000 }]} />
      </Demo>
      <Demo title="Payment card" slug="payment-card">
        <div className="flex flex-wrap gap-4">
          <PaymentCard number="0000000000001234" holder="Alex Sample" expiry="08/29" />
          <PaymentCard number="0000000000005678" holder="Sam Example" expiry="01/28" variant="ocean" brand="Demo Pay" />
        </div>
      </Demo>
      <Demo title="Spend limit" slug="spend-limit">
        <SpendLimit spent={32_000} />
      </Demo>
      <Demo title="Recurring bills" slug="recurring-bills">
        <RecurringBills bills={BILLS} />
      </Demo>
      <Demo title="ASCII globe" slug="ascii-globe">
        <div className="flex justify-center"><AsciiGlobe /></div>
      </Demo>
      <Demo title="ASCII text" slug="ascii-text">
        <div className="flex justify-center"><AsciiText text="HELLO" rows={16} fontSize={7} /></div>
      </Demo>
      <Demo title="ASCII image" slug="ascii-image">
        <AsciiImage src={LANDSCAPE} alt="A mountain under a bright sun" cols={90} />
      </Demo>
      <Demo title="ASCII field" slug="ascii-field">
        <div className="h-56 overflow-hidden rounded-[16px] bg-surface"><AsciiField className="h-full" /></div>
      </Demo>
      <Demo title="ASCII loader" slug="ascii-loader">
        <div className="flex flex-wrap items-center gap-8">
          <AsciiLoader variant="spinner" label="Loading" showLabel />
          <AsciiLoader variant="dots" label="Thinking" showLabel />
          <AsciiLoader variant="bar" label="Uploading" />
          <AsciiLoader variant="wave" label="Listening" />
        </div>
      </Demo>
      <Demo title="Spotlight card" slug="spotlight-card">
        <SpotlightCard className="max-w-sm">
          <h4 className="text-base font-semibold text-fg">Move your pointer</h4>
          <p className="mt-1 text-sm text-fg-muted">A soft light follows the cursor across the card surface.</p>
        </SpotlightCard>
      </Demo>
      <Demo title="Text scramble" slug="text-scramble">
        <p className="text-2xl font-semibold text-fg"><TextScramble text="Decoding the signal" /></p>
      </Demo>
      <Demo title="Shiny text" slug="shiny-text">
        <p className="text-2xl font-semibold"><ShinyText pauseOnHover>Introducing the new workspace</ShinyText></p>
      </Demo>
      <Demo title="Dot field" slug="dot-field">
        <div className="h-56 overflow-hidden rounded-[16px] bg-surface"><DotField /></div>
      </Demo>
    </div>
  );
}
