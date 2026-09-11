"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Crown,
  Instagram,
  MapPin,
  Phone,
  Play,
  ShieldCheck,
  Trophy,
  Users,
} from "lucide-react";
import SiteHeader from "./components/SiteHeader";
import SiteImageSync from "./components/SiteImageSync";
import MatchArchive from "./components/MatchArchive";
import { getSupabaseClient } from "../lib/supabase";

const getWeekDays = (offset: number) => {
  const start = new Date();
  start.setHours(12, 0, 0, 0);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7) + offset * 7);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      day: new Intl.DateTimeFormat("tr-TR", { weekday: "short" }).format(date),
      date: date.toISOString().slice(0, 10),
      year: date.getFullYear(),
      dayNumber: date.getDate(),
      full: new Intl.DateTimeFormat("tr-TR", {
        day: "numeric",
        month: "long",
      }).format(date),
    };
  });
};

const getIsoWeek = (date: Date) => {
  const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = utcDate.getUTCDay() || 7;
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
  return Math.ceil(((utcDate.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
};

const slots = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
  "22:00",
  "23:00",
  "00:00",
  "01:00",
];

const daytimeSlots = slots.filter(
  (slot) => Number(slot.slice(0, 2)) >= 9 && Number(slot.slice(0, 2)) <= 17,
);
const nighttimeSlots = slots.filter(
  (slot) => Number(slot.slice(0, 2)) >= 18 || Number(slot.slice(0, 2)) < 2,
);

const packages = [
  {
    title: "Gündüz Tarifesi",
    price: 1200,
    note: "12:00 - 18:00 arası",
    detail: "1 saat saha kullanımı",
    duration: 1,
  },
  {
    title: "Gece Tarifesi",
    price: 1800,
    note: "18:00 - 02:00 arası",
    detail: "1 saat saha kullanımı",
    duration: 1,
  },
  {
    title: "Maç Kaydı",
    price: 0,
    note: "Abonelere ücretsiz",
    detail: "Maçınızı tekrar izleyin",
    duration: 1,
  },
];

const mapUrl =
  "https://www.google.com/maps/search/?api=1&query=Bagmanci+Hali+Saha+Sanliurfa";

type SubscriptionSlot = {
  user_id: string;
  subscription_day: string;
  subscription_time: string;
  active: boolean;
  created_at: string;
};

export default function Home() {
  const [weekOffset, setWeekOffset] = useState(0);
  const days = getWeekDays(weekOffset);
  const [selectedDay, setSelectedDay] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState(packages[0]);
  const [selectedDuration, setSelectedDuration] = useState(1);
  const [durationNotice, setDurationNotice] = useState("");
  const [booked, setBooked] = useState<
    { date: string; time: string; duration: number }[]
  >([]);
  const [subscriptionSlots, setSubscriptionSlots] = useState<
    SubscriptionSlot[]
  >([]);
  const [form, setForm] = useState({ name: "", phone: "", subscriber: false });
  const [subscriberVerified, setSubscriberVerified] = useState(false);
  const [discountEligible, setDiscountEligible] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [profileDefaults, setProfileDefaults] = useState({
    name: "",
    phone: "",
  });
  const [notice, setNotice] = useState("");
  const [videoPlaying, setVideoPlaying] = useState(false);

  const selectedLabel =
    days.find((day) => day.date === selectedDay)?.full ?? selectedDay;
  const weekTitleDate = new Date(`${days[0].date}T12:00:00`);
  const weekTitle = `${new Intl.DateTimeFormat("tr-TR", { month: "long", year: "numeric" }).format(weekTitleDate)} • ${getIsoWeek(weekTitleDate)}. Hafta`;
  const isNightSlot = selectedSlot
    ? Number(selectedSlot.slice(0, 2)) >= 18 ||
      Number(selectedSlot.slice(0, 2)) < 2
    : selectedPackage.title === "Gece Tarifesi";
  const tariffPrice =
    selectedPackage.title === "Maç Kaydı" ? 0 : isNightSlot ? 1800 : 1200;
  const bookingPackageTitle =
    selectedPackage.title === "Maç Kaydı"
      ? selectedPackage.title
      : `${isNightSlot ? "Gece" : "Gündüz"} Tarifesi`;
  const price =
    discountEligible && tariffPrice
      ? 1700 * selectedDuration
      : tariffPrice * selectedDuration;

  useEffect(() => {
    const currentDay = days.find(
      (day) => day.date >= new Date().toISOString().slice(0, 10),
    );
    if (!days.some((day) => day.date === selectedDay))
      setSelectedDay(currentDay?.date || days[0].date);

    const loadBookings = async () => {
      const start = days[0].date;
      const end = days[days.length - 1].date;
      const { data } = await getSupabaseClient()
        .from("booking_requests")
        .select("booking_date, booking_time, duration_hours")
        .gte("booking_date", start)
        .lte("booking_date", end)
        .neq("payment_status", "rejected");

      setBooked(
        (data || []).map((item) => ({
          date: item.booking_date,
          time: item.booking_time,
          duration: Number(item.duration_hours || 1),
        })),
      );

      const { data: lockedSlots } = await getSupabaseClient()
        .from("subscription_slots")
        .select(
          "user_id, subscription_day, subscription_time, active, created_at",
        )
        .eq("active", true);

      setSubscriptionSlots(lockedSlots || []);
    };
    loadBookings();
  }, [weekOffset]);

  useEffect(() => {
    getSupabaseClient()
      .auth.getUser()
      .then(async ({ data }) => {
        if (!data.user) return;
        setCurrentUserId(data.user.id);
        const client = getSupabaseClient();
        const { data: profile } = await client
          .from("profiles")
          .select(
            "subscriber, preferred_subscription_day, preferred_subscription_time, full_name, phone",
          )
          .eq("id", data.user.id)
          .maybeSingle();

        const { data: ownSlot } = await client
          .from("subscription_slots")
          .select("subscription_day, subscription_time, active, created_at")
          .eq("user_id", data.user.id)
          .eq("active", true)
          .maybeSingle();

        const isActiveSubscriber = Boolean(profile?.subscriber && ownSlot);
        setSubscriberVerified(isActiveSubscriber);
        setProfileDefaults({
          name: profile?.full_name || data.user.user_metadata?.full_name || "",
          phone: profile?.phone || data.user.user_metadata?.phone || "",
        });

        const { count } = await client
          .from("booking_requests")
          .select("id", { count: "exact", head: true })
          .eq("user_id", data.user.id)
          .in("payment_status", ["paid", "approved"]);

        const subscriptionAge = ownSlot?.created_at
          ? Date.now() - new Date(ownSlot.created_at).getTime()
          : 0;

        setDiscountEligible(
          Boolean(
            isActiveSubscriber &&
              subscriptionAge >= 7 * 86400000 &&
              (count || 0) >= 1,
          ),
        );

        setForm((current) => ({
          ...current,
          name:
            profile?.full_name ||
            data.user.user_metadata?.full_name ||
            current.name,
          phone: profile?.phone || data.user.user_metadata?.phone || current.phone,
          subscriber: Boolean(profile?.subscriber),
        }));
      });
  }, []);

  const choosePackage = (pack: (typeof packages)[number]) => {
    setSelectedPackage(pack);
    setNotice(`${pack.title} seçildi. Şimdi gün ve saatini belirleyebilirsin.`);
    document
      .getElementById("rezervasyon")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  const submitBooking = async () => {
    if (
      !selectedSlot ||
      !form.name ||
      !/^0\d{10}$/.test(form.phone.replace(/\s/g, ""))
    ) {
      setNotice("Lütfen saat, ad soyad ve 11 haneli telefon numarasını girin.");
      return;
    }
    setNotice("Maç kaydı oluşturuluyor...");
    try {
      const client = getSupabaseClient();
      if (await refreshSlotAvailability()) {
        setNotice("Seçtiğiniz saat artık müsait değil. Lütfen başka bir saat seçin.");
        return;
      }
      const { data: authData } = await client.auth.getUser();
      const { data, error } = await client
        .from("booking_requests")
        .insert({
          user_id: authData.user?.id || null,
          customer_name: form.name.trim(),
          phone: form.phone.replace(/\s/g, ""),
          booking_date: selectedDay,
          booking_time: selectedSlot,
          duration_hours: selectedDuration,
          subscriber: subscriberVerified,
          package_name: bookingPackageTitle,
          total_amount: price,
          deposit_amount: 600,
          payment_choice: "deposit",
          payment_status: "pending",
        })
        .select("id, payment_token")
        .single();

      if (error) throw error;
      setBooked((current) => [
        ...current,
        { date: selectedDay, time: selectedSlot, duration: selectedDuration },
      ]);
      setSelectedSlot(null);
      setForm({ name: "", phone: "", subscriber: false });
      window.location.href = `/odeme?booking=${data.id}&token=${data.payment_token}`;
    } catch (error) {
      setNotice(
        error instanceof Error
          ? `Maç kaydı oluşturulamadı: ${error.message}`
          : "Maç kaydı oluşturulamadı.",
      );
    }
  };

  const selectedWeekday = new Intl.DateTimeFormat("tr-TR", {
    weekday: "long",
  }).format(new Date(`${selectedDay}T12:00:00`)).toLocaleLowerCase("tr-TR");

  const subscriptionLocked = (slot: string) =>
    subscriptionSlots.some(
      (item) =>
        item.user_id !== currentUserId &&
        item.subscription_day.toLocaleLowerCase("tr-TR") === selectedWeekday &&
        item.subscription_time.startsWith(slot) &&
        item.active,
    );

  const ownSubscriptionSlot = (slot: string) =>
    subscriptionSlots.some(
      (item) =>
        item.user_id === currentUserId &&
        item.subscription_day.toLocaleLowerCase("tr-TR") === selectedWeekday &&
        item.subscription_time.startsWith(slot) &&
        item.active,
    );

  const isSlotUnavailable = (slot: string, duration: number) => {
    const startHour = Number(slot.slice(0, 2));
    const requestedEnd = startHour + duration;
    return booked.some((booking) => {
      if (booking.date !== selectedDay) return false;
      const bookingStart = Number(booking.time.slice(0, 2));
      const bookingEnd = bookingStart + booking.duration;
      return startHour < bookingEnd && requestedEnd > bookingStart;
    });
  };

  const isDurationUnavailable = (slot: string, duration: number) => {
    const startHour = Number(slot.slice(0, 2));
    const lockedBySubscription = Array.from(
      { length: Math.ceil(duration) },
      (_, index) => `${(startHour + index) % 24}`.padStart(2, "0") + ":00",
    ).some((hour) => subscriptionLocked(hour));
    return isSlotUnavailable(slot, duration) || lockedBySubscription;
  };

  const refreshSlotAvailability = async () => {
    if (!selectedSlot) return false;
    const { data, error } = await getSupabaseClient()
      .from("booking_requests")
      .select("booking_time, duration_hours")
      .eq("booking_date", selectedDay)
      .neq("payment_status", "rejected");
    if (error) throw error;
    return (data || []).some((item) => {
      const start = Number(selectedSlot.slice(0, 2));
      const bookingStart = Number(item.booking_time.slice(0, 2));
      const bookingDuration = Number(item.duration_hours || 1);
      return start < bookingStart + bookingDuration &&
        start + selectedDuration > bookingStart;
    });
  };

  const selectDuration = (duration: number) => {
    if (!selectedSlot) {
      setSelectedDuration(duration);
      setDurationNotice("Önce bir saat seçin.");
      return;
    }
    if (isDurationUnavailable(selectedSlot, duration)) {
      setDurationNotice(
        duration === 1.5
          ? "Seçtiğiniz saatin arkasındaki saat dolu olduğu için yarım saat uzatma eklenemez. Lütfen 1 saati seçin veya ardışık boş saat aralığı bulun."
          : "Seçilen saat aralığı müsait değil.",
      );
      if (duration !== 1) setSelectedDuration(1);
      return;
    }
    setSelectedDuration(duration);
    setDurationNotice(
      duration === 1.5
        ? "✓ Sonraki saat müsait olduğu için 1.5 saatlik maç süresi tanımlandı."
        : "",
    );
  };

  const renderSlot = (slot: string) => {
    const slotHour = Number(slot.slice(0, 2));
    const isBooked = booked.some((booking) => {
      if (booking.date !== selectedDay) return false;
      const startHour = Number(booking.time.slice(0, 2));
      return slotHour >= startHour && slotHour < startHour + booking.duration;
    });
    const isSubscriptionLocked = subscriptionLocked(slot);
    const isOwnSubscription = ownSubscriptionSlot(slot);
    const isSubscriptionSlot = isSubscriptionLocked || isOwnSubscription;
    const exceedsClosing = selectedDuration > 1 && slot === "01:00";
    const isLocked =
      (isBooked && !isOwnSubscription) ||
      (isSubscriptionLocked && !isOwnSubscription) ||
      exceedsClosing;
    const endSlot = `${String((slotHour + 1) % 24).padStart(2, "0")}:00`;

    return (
      <button
        key={slot}
        type="button"
        disabled={isLocked}
        onClick={() => {
          setSelectedSlot(slot);
          if (
            selectedDuration > 1 &&
            isDurationUnavailable(slot, selectedDuration)
          ) {
            setSelectedDuration(1);
            setDurationNotice(
              "Seçilen saatin devamında yeterli boşluk olmadığı için maç süresi 1 saate ayarlandı.",
            );
          } else {
            setDurationNotice("");
          }
          if (isOwnSubscription)
            setForm((current) => ({
              ...current,
              name: profileDefaults.name,
              phone: profileDefaults.phone,
              subscriber: true,
            }));
          setNotice("");
        }}
        className={`schedule-slot ${isSubscriptionSlot ? "schedule-slot-vip" : ""} ${isLocked ? "schedule-slot-locked" : selectedSlot === slot ? "schedule-slot-selected !bg-amber-400 !text-black !border-amber-400 font-bold" : "!bg-[#0d2e22] !text-white !border-amber-500/30 hover:!border-amber-400"}`}
      >
        {isSubscriptionSlot && <Crown className="schedule-slot-crown text-amber-400" size={15} />}
        {isSubscriptionLocked && !isOwnSubscription ? (
          <>
            <span className="text-white/60">{slot}</span>
            <i aria-hidden="true" className="text-amber-400">•</i>
            <span className="text-white/60">{endSlot}</span>
            <small className="text-amber-400/80">DOLU / ABONE</small>
          </>
        ) : isBooked && !isOwnSubscription ? (
          <>
            <span className="text-white/40">{slot}</span>
            <small className="text-red-300">DOLU</small>
          </>
        ) : (
          <>
            <span className="font-semibold text-white">{slot}</span>
            <i aria-hidden="true" className="text-amber-400">•</i>
            <span className="font-semibold text-white">{endSlot}</span>
          </>
        )}
      </button>
    );
  };

  return (
    <main id="top" className="min-h-screen bg-[#051811] text-[#F8FAFC]">
      <SiteHeader />
      <SiteImageSync />
      <MatchArchive />

      {/* HERO SECTION */}
      <section className="noise field-lines relative flex min-h-[700px] items-center overflow-hidden bg-[#051811] px-5 pb-16 pt-32 text-white lg:min-h-[780px] lg:px-8">
        <div className="mx-auto grid w-full max-w-[1240px] items-end gap-12 lg:grid-cols-[1.05fr_.95fr] lg:gap-16">
          <div className="relative z-10 max-w-[680px]">
            <div className="mb-7 flex items-center gap-2 text-sm font-semibold text-amber-300">
              <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />{" "}
              Bağmancı Halı Saha · Şanlıurfa
            </div>
            <h1 className="display max-w-[680px] text-[clamp(3.8rem,8vw,7.5rem)] font-extrabold leading-[.9]">
              Maçın adresi <span className="text-amber-400">belli.</span>
            </h1>
            <p className="mt-8 max-w-[470px] text-lg leading-8 text-white/70">
              Takımını topla, paketi seç, sahanı ayırt. Gündüz tarifesi 1200 TL,
              gece tarifesi 1800 TL.
            </p>
            <a
              href="#paketler"
              className="mt-9 inline-flex items-center gap-3 rounded-full bg-amber-400 px-6 py-4 text-sm font-bold text-black hover:bg-amber-300"
            >
              Paket seç <ArrowRight size={18} />
            </a>
          </div>
          <div className="relative mx-auto w-full max-w-[500px] lg:mb-[-55px]">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[180px_180px_18px_18px] border-[10px] border-emerald-800/40 shadow-2xl">
              <img
                className="h-full w-full object-cover"
                src="https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=900&q=85"
                alt="Bağmancı Halı Saha"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#051811]/90 via-transparent to-transparent" />
            </div>
            <div className="absolute -bottom-7 -left-5 flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-[#09261b]/95 p-4 text-white shadow-2xl backdrop-blur-md sm:-left-10">
              <div className="flex -space-x-2">
                <span className="h-9 w-9 rounded-full border-2 border-amber-400/50 bg-cover" style={{ backgroundImage: "url('https://i.pravatar.cc/80?img=12')" }} />
                <span className="h-9 w-9 rounded-full border-2 border-amber-400/50 bg-cover" style={{ backgroundImage: "url('https://i.pravatar.cc/80?img=32')" }} />
                <span className="h-9 w-9 rounded-full border-2 border-amber-400/50 bg-cover" style={{ backgroundImage: "url('https://i.pravatar.cc/80?img=13')" }} />
              </div>
              <div>
                <p className="text-xs text-emerald-200/60">Bu hafta sahada</p>
                <p className="font-extrabold text-amber-300">120+ oyuncu</p>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-7 left-5 hidden items-center gap-3 text-xs font-semibold text-white/50 lg:flex">
          <span className="h-px w-10 bg-amber-400/40" /> Şanlıurfa · Bağmancı
        </div>
      </section>

      {/* TARİFELER SECTION */}
      <section
        id="paketler"
        className="bg-[#04130d] px-5 py-20 lg:px-8 lg:py-28"
      >
        <div className="mx-auto max-w-[1240px]">
          <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="mb-4 text-sm font-bold uppercase tracking-[.18em] text-amber-400">
                Tarifeler
              </p>
              <h2 className="display text-4xl font-extrabold leading-none text-white sm:text-5xl">
                İhtiyacına uygun{" "}
                <span className="text-amber-400">paketi seç.</span>
              </h2>
            </div>
            <p className="max-w-[290px] text-sm leading-6 text-white/60">
              Gündüz 1200 TL, gece 1800 TL. Tamamlanmış ilk haftadan sonra aktif
              abonelere sabit 1.700 TL fiyat uygulanır.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {packages.map((pack, index) => (
              <article
                key={pack.title}
                className={`pricing-card relative rounded-3xl border p-7 backdrop-blur-md transition ${index === 1 ? "border-amber-400/60 bg-[#0c3123] text-white shadow-[0_0_30px_rgba(251,191,36,0.15)] md:-translate-y-3" : "border-emerald-800/30 bg-[#082218] text-white"}`}
              >
                <p
                  className={`pricing-card-accent text-sm font-bold ${index === 1 ? "text-amber-300" : "text-emerald-300"}`}
                >
                  {pack.title}
                </p>
                <div className="mt-5 flex items-end gap-1">
                  <span className="display pricing-card-title text-5xl font-extrabold text-white">
                    {pack.price ? `₺${pack.price}` : "Ücretsiz"}
                  </span>
                  {pack.price ? (
                    <span className="text-white/60">/saat</span>
                  ) : null}
                </div>
                <p className="pricing-card-note mt-2 text-sm text-white/60">
                  {pack.note}
                </p>
                <div className="my-7 h-px bg-white/10" />
                <p className="mb-5 flex items-center gap-3 text-sm text-white/80">
                  <Check
                    size={17}
                    className={index === 1 ? "text-amber-400" : "text-emerald-400"}
                  />{" "}
                  {pack.detail}
                </p>
                <button
                  onClick={() => choosePackage(pack)}
                  className={`flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold transition ${index === 1 ? "bg-amber-400 text-black hover:bg-amber-300" : "bg-emerald-800/40 text-white hover:bg-emerald-700/50 border border-emerald-700/50"}`}
                >
                  Paketi seç <ArrowRight size={16} />
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* REZERVASYON SECTION */}
      <section
        id="rezervasyon"
        className="scroll-mt-32 bg-[#051811] px-5 py-20 lg:px-8 lg:py-28"
      >
        <div className="mx-auto max-w-[1240px]">
          <div className="mb-10">
            <div className="subscriber-summary-badge inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-500/10 px-4 py-2 text-xs font-bold text-amber-300 backdrop-blur-md">
              ★ Sabit Abone Olun, 2. Haftadan İtibaren Maç Başı 100 TL Tasarruf Edin
            </div>
            <p className="mb-4 mt-4 text-sm font-bold uppercase tracking-[.18em] text-amber-300">
              Canlı takvim
            </p>
            <h2 className="display text-4xl font-extrabold leading-none text-white sm:text-5xl">
              Sahanı ayır,{" "}
              <span className="text-amber-400">maça başla.</span>
            </h2>
          </div>
          <div className="grid min-w-0 overflow-visible rounded-[28px] border border-emerald-800/40 bg-[#09261b]/90 shadow-2xl backdrop-blur-md lg:grid-cols-[1.4fr_.8fr]">
            <div className="min-w-0 p-5 sm:p-8">
              <div className="mb-7 flex items-center justify-between">
                <div>
                  <p className="text-sm text-emerald-200/60">{weekTitle}</p>
                  <p className="display text-xl font-extrabold text-white">Müsaitlikler</p>
                </div>
                <div className="flex gap-2">
                  <button
                    aria-label="Önceki hafta"
                    className="rounded-full border border-amber-400/30 p-2 text-amber-300 hover:border-amber-400"
                    onClick={() => setWeekOffset(Math.max(0, weekOffset - 1))}
                  >
                    <ChevronLeft size={17} />
                  </button>
                  <button
                    aria-label="Sonraki hafta"
                    className="rounded-full border border-amber-400/30 p-2 text-amber-300 hover:border-amber-400"
                    onClick={() => setWeekOffset(weekOffset + 1)}
                  >
                    <ChevronRight size={17} />
                  </button>
                </div>
              </div>
              <div className="schedule-days touch-pan-x scrollbar-none mb-6">
                {days.map((item) => (
                  <button
                    key={item.date}
                    disabled={
                      weekOffset === 0 &&
                      item.date < new Date().toISOString().slice(0, 10)
                    }
                    onClick={() => {
                      setSelectedDay(item.date);
                      setSelectedSlot(null);
                      setNotice("");
                    }}
                    className={`min-w-[68px] flex-shrink-0 rounded-2xl border p-3 text-center transition ${weekOffset === 0 && item.date < new Date().toISOString().slice(0, 10) ? "cursor-not-allowed border-transparent bg-black/40 text-white/20" : selectedDay === item.date ? "border-amber-400 bg-amber-400 text-black font-extrabold shadow-[0_0_15px_rgba(251,191,36,0.3)]" : "border-emerald-800/50 bg-[#0a2318] text-white hover:border-amber-400/50"}`}
                  >
                    <span className="mt-1 block text-xs font-semibold opacity-60">
                      {item.day}
                    </span>
                    <span className="mt-1 block text-lg font-extrabold">
                      {item.dayNumber}
                    </span>
                  </button>
                ))}
              </div>
              <div className="schedule-row">
                <div className="schedule-row-label text-emerald-300/70">GÜNDÜZ</div>
                <div className="schedule-row-scroll touch-pan-x scrollbar-none">
                  {daytimeSlots.map(renderSlot)}
                </div>
              </div>
              <div className="schedule-row">
                <div className="schedule-row-label text-amber-300/70">GECE</div>
                <div className="schedule-row-scroll touch-pan-x scrollbar-none">
                  {nighttimeSlots.map(renderSlot)}
                </div>
              </div>
            </div>
            <div className="booking-form-card mx-0 box-border w-full min-w-0 rounded-2xl border-t border-emerald-800/40 bg-[#061e15] p-4 text-white sm:rounded-none sm:border-l sm:border-t-0 sm:p-8">
              <div className="mb-8 flex items-center gap-3">
                <CalendarDays className="text-amber-400" />
                <div>
                  <p className="text-xs text-white/60">Seçimin</p>
                  <p className="font-bold text-amber-300">
                    {selectedLabel} {selectedSlot ?? "· saat seç"}
                  </p>
                </div>
              </div>
              <div className="mb-5">
                <p className="mb-2 text-sm font-semibold text-white/80">Maç süresi</p>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 1.5, 2].map((duration) => (
                    <button
                      key={duration}
                      type="button"
                      onClick={() => selectDuration(duration)}
                      className={`rounded-xl border px-3 py-3 text-sm font-extrabold transition ${selectedDuration === duration ? "border-amber-400 bg-amber-400 text-black" : "border-emerald-800/40 bg-[#0a2318] text-white hover:border-amber-400/40"}`}
                    >
                      {duration === 1.5 ? "1,5 saat" : `${duration} saat`}
                    </button>
                  ))}
                </div>
                {durationNotice && (
                  <p className="mt-2 text-xs font-semibold text-amber-300">
                    {durationNotice}
                  </p>
                )}
              </div>
              <label className="mb-3 block text-sm font-semibold text-white/80">
                Ad soyad
                <input
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                  className="mt-2 w-full rounded-xl border border-emerald-800/50 bg-[#0a2318] px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-amber-400"
                  placeholder="Takım kaptanı"
                />
              </label>
              <label className="mb-4 block text-sm font-semibold text-white/80">
                Telefon
                <input
                  value={form.phone}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      phone: event.target.value.replace(/\D/g, "").slice(0, 11),
                    })
                  }
                  className="mt-2 w-full rounded-xl border border-emerald-800/50 bg-[#0a2318] px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-amber-400"
                  placeholder="05xx xxx xx xx"
                />
              </label>
              {ownSubscriptionSlot(selectedSlot || "") && (
                <div className="mb-4 inline-flex rounded-full border border-amber-400 bg-amber-500/20 px-4 py-2 text-xs font-black text-amber-300">
                  ★ Sizin Sabit Abonelik Saatiniz
                </div>
              )}
              {discountEligible && (
                <div className="mb-6 rounded-xl border border-amber-400 bg-amber-500/20 px-4 py-3 text-amber-300">
                  <div className="text-sm font-black">
                    <span className="mr-2 text-xl line-through opacity-60">
                      1.800 TL
                    </span>
                    <span className="text-xl text-amber-400">1.700 TL</span>
                  </div>
                  <p className="mt-1 text-[11px] font-bold">
                    ★ Bağmancı Sadık Abone İndirimi Uygulandı
                  </p>
                </div>
              )}
              <div className="mb-5 flex items-center justify-between border-t border-emerald-800/40 pt-5">
                <span className="text-sm text-white/60">Ödenecek tutar</span>
                <strong className="text-2xl text-amber-400">
                  {price ? `${price.toFixed(0)} TL` : "Ücretsiz"}
                </strong>
              </div>
              <button
                onClick={submitBooking}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-amber-400 px-5 py-4 text-sm font-extrabold text-black transition hover:bg-amber-300"
              >
                Maç kaydı oluştur <ArrowRight size={17} />
              </button>
              {notice && (
                <p className="mt-4 rounded-xl border border-emerald-800/40 bg-[#0a2318] p-3 text-sm text-white/80">
                  {notice}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* MAÇ KAYITLARI SECTION */}
      <section
        id="kayitlar"
        className="bg-[#04130d] px-5 py-20 lg:px-8 lg:py-28"
      >
        <div className="mx-auto max-w-[1240px]">
          <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="mb-4 text-sm font-bold uppercase tracking-[.18em] text-amber-400">
                Maç kayıtları
              </p>
              <h2 className="display text-4xl font-extrabold leading-none text-white sm:text-5xl">
                Güzel maçın{" "}
                <span className="text-amber-400">tekrarı olur.</span>
              </h2>
            </div>
            <p className="max-w-[270px] text-sm leading-6 text-white/60">
              Abonelerimizin maç kaydı ücretsizdir. Normal saat kiralayanlar
              için kayıt ayrıca ücretli olabilir.
            </p>
          </div>
          <div className="group relative min-h-[390px] overflow-hidden rounded-3xl border border-emerald-800/40 bg-[#051811]">
            <img
              className="absolute inset-0 h-full w-full object-cover opacity-75 transition duration-700 group-hover:scale-105"
              src="https://images.unsplash.com/photo-1553778263-73a83bab9b0c?auto=format&fit=crop&w=1200&q=85"
              alt="Bağmancı Halı Saha maç kaydı"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
            {videoPlaying ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <p className="rounded-full bg-amber-400 px-5 py-3 text-sm font-bold text-black">
                  Maç kaydı oynatılıyor
                </p>
              </div>
            ) : (
              <button
                aria-label="Maç videosunu oynat"
                onClick={() => setVideoPlaying(true)}
                className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-amber-400 text-black transition group-hover:scale-110"
              >
                <Play fill="currentColor" size={23} />
              </button>
            )}
            <div className="absolute bottom-6 left-6 text-white">
              <span className="mb-2 inline-block rounded-full border border-amber-400/40 bg-black/40 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-300 backdrop-blur">
                Gerçek maç arşivi
              </span>
              <h3 className="display text-2xl font-extrabold text-white">
                Maç kayıtları arşivden yüklenir
              </h3>
              <p className="mt-1 text-xs text-white/60">
                Admin tarafından eklenen kayıtlar burada görünür
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* İLETİŞİM & TARİFELER SECTION */}
      <section
        id="iletisim"
        className="bg-[#051811] px-5 py-20 text-white lg:px-8 lg:py-28"
      >
        <div className="mx-auto max-w-[1240px]">
          <div className="grid gap-12 lg:grid-cols-[1fr_1fr]">
            <div>
              <p className="mb-4 text-sm font-bold uppercase tracking-[.18em] text-amber-400">
                Bize ulaş
              </p>
              <h2 className="display max-w-[500px] text-5xl font-extrabold leading-none">
                Takımın hazırsa,{" "}
                <span className="text-amber-400">biz de hazırız.</span>
              </h2>
              <p className="mt-6 max-w-[430px] text-white/65">
                Bağmancı Halı Saha, Şanlıurfa. Adresimizi haritada açabilir,
                doğrudan bizi arayabilirsin.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="tel:05452237878"
                  className="flex items-center gap-2 rounded-full bg-amber-400 px-5 py-3 text-sm font-bold text-black hover:bg-amber-300"
                >
                  <Phone size={16} /> 0545 223 78 78
                </a>
                <a
                  href="tel:04142475151"
                  className="flex items-center gap-2 rounded-full border border-amber-400/30 px-5 py-3 text-sm font-bold text-white hover:border-amber-400"
                >
                  <Phone size={16} /> 0414 247 51 51
                </a>
              </div>
              <div className="mt-5 flex gap-3">
                <a
                  aria-label="Instagram hesabımız"
                  href="https://www.instagram.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-emerald-800/40 bg-[#09261b] p-3 text-amber-300 hover:border-amber-400"
                >
                  <Instagram size={18} />
                </a>
                <a
                  aria-label="Konumu Google Haritalar'da aç"
                  href={mapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-emerald-800/40 bg-[#09261b] p-3 text-amber-300 hover:border-amber-400"
                >
                  <MapPin size={18} />
                </a>
              </div>
            </div>
            <div className="map-frame overflow-hidden rounded-3xl border border-emerald-800/40 bg-[#09261b] p-2">
              <iframe
                title="Bağmancı Halı Saha konumu"
                src="https://www.google.com/maps?q=Bağmancı+Halı+Saha+Şanlıurfa&output=embed"
                className="h-[360px] w-full rounded-2xl border-0"
                loading="lazy"
              />
            </div>
          </div>
          <div className="mt-16 grid gap-5 border-t border-emerald-800/40 pt-8 sm:grid-cols-3">
            <div className="rounded-2xl border border-emerald-800/30 bg-[#09261b]/60 p-5 backdrop-blur-md">
              <Clock3 className="mb-3 text-amber-400" size={24} />
              <p className="font-bold text-white text-lg">Gündüz tarifesi</p>
              <p className="mt-1 text-sm text-emerald-200/70 font-medium">
                12:00 - 18:00 · 1200 TL
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-800/30 bg-[#09261b]/60 p-5 backdrop-blur-md">
              <Clock3 className="mb-3 text-amber-400" size={24} />
              <p className="font-bold text-white text-lg">Gece tarifesi</p>
              <p className="mt-1 text-sm text-emerald-200/70 font-medium">
                18:00 sonrası · 1800 TL
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-800/30 bg-[#09261b]/60 p-5 backdrop-blur-md">
              <Users className="mb-3 text-amber-400" size={24} />
              <p className="font-bold text-white text-lg">Abone avantajı</p>
              <p className="mt-1 text-sm text-emerald-200/70 font-medium">
                İlk tamamlanmış haftadan sonra 1.700 TL abone fiyatı
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="site-footer border-t border-emerald-900/60 bg-[#030e0a] px-5 py-8 text-sm text-white/60 lg:px-8">
        <div className="mx-auto flex max-w-[1240px] flex-col justify-between gap-4 sm:flex-row">
          <span>© 2026 Bağmancı Halı Saha</span>
          <div className="flex gap-5">
            <a href="/musteri" className="hover:text-amber-400 transition">
              Müşteri girişi
            </a>
            <a href="/gizlilik" className="hover:text-amber-400 transition">
              Gizlilik
            </a>
            <a href="/guvenlik" className="hover:text-amber-400 transition">
              Güvenlik
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}