"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent, ReactNode } from "react";
import Image from "next/image";
import { CalendarDays, Heart } from "lucide-react";
import type { BestPhoto, LovePageDraft, Moment } from "@/lib/types";
import { cn } from "@/lib/utils";

type TimeTogether = {
  days: number;
  hours: number;
  minutes: number;
};

export function GiftPage({ page, preview = false }: { page: LovePageDraft; preview?: boolean }) {
  const [now, setNow] = useState<Date | null>(null);
  const title = page.title || "Uma carta para guardar nossa história";
  const creator = page.creatorName || "Você";
  const recipient = page.recipientName || "pessoa especial";
  const mainPhoto = page.mainPhotoSignedUrl;
  const bestPhotos = useMemo(() => page.bestPhotos.slice().sort((a, b) => a.sortOrder - b.sortOrder).slice(0, 5), [page.bestPhotos]);
  const backgroundPhotos = useMemo(() => getBackgroundPhotos(page), [page]);
  const moments = useMemo(() => getStoryMoments(page.moments), [page.moments]);
  const timeTogether = getTimeTogether(page.relationshipStartedAt, now);
  const startDate = page.relationshipStartedAt || page.metAt;

  useEffect(() => {
    setNow(new Date());
    const interval = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <main className="letter-page min-h-screen text-[#191512]">
      {preview ? (
        <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-full border border-black/10 bg-white/95 px-4 py-2 text-xs font-black uppercase text-rosewood shadow-soft">
          Pré-visualização
        </div>
      ) : null}

      <PremiumHero
        title={title}
        introMessage={page.introMessage}
        creator={creator}
        recipient={recipient}
        mainPhoto={mainPhoto}
        backgroundPhotos={backgroundPhotos}
      />

      <LetterFacts startDate={startDate} timeTogether={timeTogether} />

      <BestPhotosReveal photos={bestPhotos} />

      <TimelineStory moments={moments} recipient={recipient} />

      <FinalLetter creator={creator} recipient={recipient} finalMessage={page.finalMessage} />
    </main>
  );
}

function PremiumHero({
  title,
  introMessage,
  creator,
  recipient,
  mainPhoto,
  backgroundPhotos
}: {
  title: string;
  introMessage: string;
  creator: string;
  recipient: string;
  mainPhoto?: string;
  backgroundPhotos: string[];
}) {
  const sectionRef = useRef<HTMLElement | null>(null);

  function handlePointerMove(event: PointerEvent<HTMLElement>) {
    const rect = sectionRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    sectionRef.current?.style.setProperty("--hero-mouse-x", String(x));
    sectionRef.current?.style.setProperty("--hero-mouse-y", String(y));
  }

  return (
    <section
      ref={sectionRef}
      className="letter-hero-section premium-hero-section flex min-h-screen items-center px-5 py-8 sm:px-8"
      onPointerMove={handlePointerMove}
    >
      <HeartParticles active tone="light" />
      <HeroPhotoCloud photos={backgroundPhotos} />
      <div className="premium-hero-shell mx-auto flex w-full max-w-3xl flex-col items-center text-center">
        <div className="letter-title-row premium-title-row">
          <h1>{title}</h1>
          <p>{introMessage || "Uma lembrança feita para abrir com calma, sorrir um pouco e guardar por perto."}</p>
        </div>

        <PrintedPhoto mainPhoto={mainPhoto} className="premium-hero-photo" alt="Foto principal do presente" />

        <div className="premium-address-card">
          <p><span>De:</span> {creator}</p>
          <p><span>Para:</span> {recipient}</p>
        </div>

        <div className="premium-scroll-cue" aria-hidden="true">
          <span />
        </div>
      </div>
    </section>
  );
}

function HeroPhotoCloud({ photos }: { photos: string[] }) {
  if (!photos.length) return null;

  return (
    <div className="hero-photo-cloud" aria-hidden="true">
      {photos.slice(0, 12).map((photo, index) => (
        <div key={`${photo}-${index}`} className={cn("hero-cloud-photo", `hero-cloud-photo-${(index % 12) + 1}`)}>
          <Image src={photo} alt="" fill className="object-cover" sizes="180px" />
        </div>
      ))}
    </div>
  );
}

function LetterFacts({
  startDate,
  timeTogether
}: {
  startDate: string | null | undefined;
  timeTogether: TimeTogether;
}) {
  return (
    <>
      <section className="letter-gradient-bridge" aria-hidden="true" />
      <section className="letter-facts-section relative bg-white text-black">
        <FactScreen>
          <p className="fact-kicker">O começo</p>
          <h2 className="fact-line">
            <TypewriterText
              segments={[
                { text: "No dia " },
                { text: formatGiftDate(startDate), strong: true },
                { text: ", tudo começou." }
              ]}
            />
          </h2>
        </FactScreen>

        <FactScreen className="fact-screen-calendar">
          <CalendarCard days={timeTogether.days} />
          <h2 className="fact-line fact-line-after-art">
            Estamos juntos há <strong>{timeTogether.days.toLocaleString("pt-BR")} dias</strong>.
          </h2>
        </FactScreen>

        <FactScreen className="fact-screen-clock">
          <ClockCounter />
          <h2 className="fact-line fact-line-after-art">
            São <strong><CountUpNumber value={timeTogether.minutes} /></strong> minutos juntos.
          </h2>
        </FactScreen>

        <FactScreen>
          <HeartParticles active />
          <h2 className="fact-line">
            <TypewriterText segments={[{ text: "E eu quero que esse número fique maior a cada dia." }]} />
          </h2>
        </FactScreen>
      </section>
    </>
  );
}

function FactScreen({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.38 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={cn("fact-screen px-5 py-20 sm:px-8", visible && "fact-screen-visible", className)}>
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center text-center">
        {children}
      </div>
    </div>
  );
}

function CalendarCard({ days }: { days: number }) {
  return (
    <div className="calendar-art" aria-hidden="true">
      <div className="calendar-rings">
        <span />
        <span />
      </div>
      <div className="calendar-head">dias juntos</div>
      <div className="calendar-number"><CountUpNumber value={days} /></div>
      <div className="calendar-grid">
        {Array.from({ length: 21 }).map((_, index) => (
          <span key={index} className={index % 4 === 0 ? "calendar-heart" : ""} />
        ))}
      </div>
    </div>
  );
}

function ClockCounter() {
  return (
    <div className="clock-art" aria-hidden="true">
      <div className="clock-face">
        <span className="clock-hand clock-hand-hour" />
        <span className="clock-hand clock-hand-minute" />
        <span className="clock-center" />
      </div>
    </div>
  );
}

function CountUpNumber({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    let frame = 0;
    let started = false;
    const duration = 1500;

    function animate() {
      const start = performance.now();

      function tick(now: number) {
        const progress = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplay(Math.round(value * eased));
        if (progress < 1) frame = requestAnimationFrame(tick);
      }

      frame = requestAnimationFrame(tick);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          started = true;
          animate();
        }
      },
      { threshold: 0.45 }
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value]);

  return <span ref={ref}>{display.toLocaleString("pt-BR")}</span>;
}

type TypewriterSegment = {
  text: string;
  strong?: boolean;
};

function TypewriterText({ segments }: { segments: TypewriterSegment[] }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [visibleChars, setVisibleChars] = useState(0);
  const fullText = segments.map((segment) => segment.text).join("");
  const totalChars = fullText.length;

  useEffect(() => {
    const node = ref.current;
    if (!node || !totalChars) return;
    let interval: number | undefined;
    let started = false;
    const charsPerTick = Math.max(1, Math.ceil(totalChars / 270));

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started) return;
        started = true;
        interval = window.setInterval(() => {
          setVisibleChars((current) => {
            const next = Math.min(totalChars, current + charsPerTick);
            if (next >= totalChars && interval) window.clearInterval(interval);
            return next;
          });
        }, 84);
      },
      { threshold: 0.45 }
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      if (interval) window.clearInterval(interval);
    };
  }, [totalChars]);

  let remaining = visibleChars;

  return (
    <span ref={ref} className="typewriter-text" aria-label={fullText}>
      <span aria-hidden="true">
        {segments.map((segment, index) => {
          const visibleText = segment.text.slice(0, Math.max(0, remaining));
          remaining -= visibleText.length;
          if (!visibleText) return null;
          return segment.strong ? <strong key={index}>{visibleText}</strong> : <span key={index}>{visibleText}</span>;
        })}
        <span className={cn("typewriter-cursor", visibleChars >= totalChars && "typewriter-cursor-done")} />
      </span>
    </span>
  );
}

function BestPhotosReveal({ photos }: { photos: BestPhoto[] }) {
  const [revealed, setRevealed] = useState<number[]>([]);
  const sectionRef = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.18, rootMargin: "0px 0px -10% 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  if (!photos.length) return null;

  function reveal(index: number) {
    setRevealed((current) => (current.includes(index) ? current : [...current, index]));
  }

  return (
    <section ref={sectionRef} className={cn("best-photos-section", visible && "best-photos-section-visible")}>
      <HeartParticles active tone="light" />
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <div className="best-photos-heading">
          <p>desafio</p>
          <h2>Você consegue acertar as nossas <span>cinco melhores fotos</span>?</h2>
          <h3>Toque em cada uma para revelar.</h3>
        </div>

        <div className="best-photos-stage">
          {photos.map((photo, index) => {
            const isRevealed = revealed.includes(index);
            const number = photos.length - index;

            return (
              <button
                key={photo.imageUrl}
                type="button"
                className={cn("best-photo-card", `best-photo-card-${index + 1}`, isRevealed && "best-photo-card-revealed")}
                onClick={() => reveal(index)}
                aria-label={`Revelar foto ${number}`}
              >
                <PrintedPhoto mainPhoto={photo.signedUrl} className="best-photo-print" alt={`Foto favorita ${number}`} />
                <span className="best-photo-number">{number}</span>
                <span className="best-photo-burst" aria-hidden="true">
                  {Array.from({ length: 10 }).map((_, burstIndex) => (
                    <span key={burstIndex}>{"\u2665"}</span>
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function TimelineStory({ moments, recipient }: { moments: Moment[]; recipient: string }) {
  return (
    <section className="relative bg-[#fffaf4] px-5 py-20 text-black sm:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-rosewood">Memórias guardadas</p>
          <h2 className="mt-4 text-5xl font-black leading-[0.98] sm:text-7xl">A linha do tempo de tudo que virou carinho.</h2>
        </div>

        <div className="timeline-track">
          {moments.map((moment, index) => (
            <TimelineMoment key={`${moment.id || index}`} moment={moment} index={index} recipient={recipient} />
          ))}
        </div>
      </div>
    </section>
  );
}

function TimelineMoment({ moment, index, recipient }: { moment: Moment; index: number; recipient: string }) {
  const images = moment.images.filter((image) => image.signedUrl).slice(0, 3);
  const title = moment.title || "Uma lembrança especial";
  const hasDate = Boolean(moment.momentDate);
  const itemRef = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [frontImageIndex, setFrontImageIndex] = useState(0);
  const dragStartRef = useRef<number | null>(null);
  const draggedRef = useRef(false);

  useEffect(() => {
    const node = itemRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.24, rootMargin: "0px 0px -12% 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (frontImageIndex >= images.length) setFrontImageIndex(0);
  }, [frontImageIndex, images.length]);

  function showNextImage() {
    if (images.length < 2) return;
    setFrontImageIndex((current) => (current + 1) % images.length);
  }

  function showPreviousImage() {
    if (images.length < 2) return;
    setFrontImageIndex((current) => (current - 1 + images.length) % images.length);
  }

  function getImageSlot(imageIndex: number) {
    if (!images.length) return 1;
    return ((imageIndex - frontImageIndex + images.length) % images.length) + 1;
  }

  return (
    <article ref={itemRef} className={cn("timeline-item", index % 2 ? "timeline-item-right" : "timeline-item-left", visible && "timeline-item-visible")}>
      <div className="timeline-dot" />
      <div className="timeline-content">
        {hasDate ? (
          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-rosewood shadow-soft">
            <CalendarDays className="h-4 w-4" />
            {formatGiftDate(moment.momentDate)}
          </p>
        ) : null}
        <h3 className="text-4xl font-black leading-tight">{title}</h3>
        <p className="mt-4 text-lg font-semibold leading-8 text-black/68">
          <TypewriterText segments={[{ text: moment.description || `Uma memória que ${recipient} vai reconhecer no instante em que abrir essa parte da carta.` }]} />
        </p>
      </div>

      <div
        className={cn("timeline-photos", images.length > 1 && "timeline-photos-interactive")}
        onPointerDown={(event) => {
          if (images.length < 2) return;
          dragStartRef.current = event.clientX;
          draggedRef.current = false;
        }}
        onPointerUp={(event) => {
          if (images.length < 2 || dragStartRef.current === null) return;
          const distance = event.clientX - dragStartRef.current;
          dragStartRef.current = null;
          if (Math.abs(distance) < 36) return;
          draggedRef.current = true;
          if (distance < 0) showNextImage();
          else showPreviousImage();
        }}
        onPointerCancel={() => {
          dragStartRef.current = null;
        }}
      >
        {images.length ? (
          images.map((image, imageIndex) => {
            const slot = getImageSlot(imageIndex);

            return (
              <button
                key={image.imageUrl}
                type="button"
                className={cn("timeline-print timeline-print-button", `timeline-print-${slot}`, slot === 1 && "timeline-print-front")}
                disabled={images.length < 2}
                onClick={() => {
                  if (draggedRef.current) {
                    draggedRef.current = false;
                    return;
                  }
                  showNextImage();
                }}
                aria-label="Trocar foto em destaque"
              >
                <PrintedPhoto
                  mainPhoto={image.signedUrl}
                  alt={`Foto da memória ${index + 1}`}
                  className="timeline-print-photo"
                />
              </button>
            );
          })
        ) : (
          <div className="timeline-empty-print">
            <Heart className="h-12 w-12 text-rosewood" />
          </div>
        )}
      </div>
    </article>
  );
}

function PrintedPhoto({ mainPhoto, className, alt }: { mainPhoto?: string; className?: string; alt: string }) {
  return (
    <div className={cn("printed-photo", className)}>
      <div className="printed-photo-image">
        {mainPhoto ? (
          <Image src={mainPhoto} alt={alt} fill className="object-cover" sizes="(min-width: 768px) 420px, 86vw" />
        ) : (
          <div className="flex h-full items-center justify-center bg-[#fff1f2] text-rosewood">
            <Heart className="h-16 w-16" />
          </div>
        )}
      </div>
    </div>
  );
}

function FinalLetter({ creator, recipient, finalMessage }: { creator: string; recipient: string; finalMessage: string }) {
  return (
    <section className="relative flex min-h-screen items-center bg-white px-5 py-20 text-black sm:px-8">
      <HeartParticles active />
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-rosewood">Para {recipient}</p>
        <h2 className="mt-5 text-5xl font-black leading-[0.98] sm:text-7xl">
          {finalMessage || "Que essa carta lembre você do quanto essa história é especial."}
        </h2>
        <p className="mx-auto mt-8 max-w-xl text-xl font-semibold leading-9 text-black/62">
          Com carinho, {creator}.
        </p>
      </div>
    </section>
  );
}

function HeartParticles({ active, tone = "rose" }: { active: boolean; tone?: "rose" | "light" }) {
  return (
    <div className={cn("heart-particles", active && "heart-particles-active", tone === "light" && "heart-particles-light")} aria-hidden="true">
      {Array.from({ length: 18 }).map((_, index) => (
        <span key={index}>{"\u2665"}</span>
      ))}
    </div>
  );
}

function getStoryMoments(moments: Moment[]) {
  const valid = moments.filter((moment) => moment.title || moment.description || moment.images.length);
  if (valid.length) return valid;

  return [
    {
      title: "O começo dessa carta",
      description: "Adicione momentos especiais para transformar esta página em uma linha do tempo completa.",
      momentDate: null,
      sortOrder: 0,
      images: []
    }
  ];
}

function getBackgroundPhotos(page: LovePageDraft) {
  const mainPhoto = page.mainPhotoSignedUrl;
  const photos = [
    ...page.bestPhotos.map((photo) => photo.signedUrl),
    ...page.moments.flatMap((moment) => moment.images.map((image) => image.signedUrl))
  ].filter((photo): photo is string => Boolean(photo && photo !== mainPhoto));

  return Array.from(new Set(photos));
}

function formatGiftDate(value: string | null | undefined) {
  if (!value) return "uma data especial";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(new Date(`${value}T00:00:00`));
}

function getTimeTogether(startedAt: string | null | undefined, now: Date | null): TimeTogether {
  if (!startedAt || !now) return { days: 0, hours: 0, minutes: 0 };

  const start = new Date(`${startedAt}T00:00:00`);
  const diffMinutes = Math.max(0, Math.floor((now.getTime() - start.getTime()) / 60000));
  return {
    days: Math.floor(diffMinutes / 1440),
    hours: Math.floor(diffMinutes / 60),
    minutes: diffMinutes
  };
}
