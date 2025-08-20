import { useEffect, useState, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

type Item = { src: string; alt: string; href?: string };
type Props = { title: string; subtitle?: string; items: Item[] };

export default function ProductsCarouselSection({
  title,
  subtitle,
  items,
}: Props) {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "start", slidesToScroll: 1 },
    [Autoplay({ delay: 4000, stopOnInteraction: true, stopOnMouseEnter: true })]
  );

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback(
    (i: number) => emblaApi?.scrollTo(i),
    [emblaApi]
  );

  useEffect(() => {
    if (!emblaApi) return;

    const update = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    // inicializa
    setScrollSnaps(emblaApi.scrollSnapList());
    update();

    emblaApi.on("select", update);
    const onReinit = () => {
      setScrollSnaps(emblaApi.scrollSnapList());
      update();
    };
    emblaApi.on("reInit", onReinit);

    return () => {
      emblaApi.off("select", update);
      emblaApi.off("reInit", onReinit);
    };
  }, [emblaApi]);

  return (
    <section id="produtos" className="w-full bg-white py-12">
      <div className="w-full max-w-[1200px] mx-auto px-4 md:px-8">
        <div className="text-center">
          <h2 className="text-[#0B1320] text-3xl md:text-5xl font-bold leading-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-lg md:text-xl text-[#495467] mt-2">{subtitle}</p>
          )}
          <span className="block mt-4 h-[3px] w-10 bg-orange-400 rounded-full mx-auto" />
        </div>

        <div className="relative mt-10">
          {/* botões */}
          <button
            type="button"
            onClick={scrollPrev}
            aria-label="Anterior"
            className="hidden md:flex absolute -left-6 top-1/2 -translate-y-1/2 z-10 h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-black/10 hover:scale-105 transition"
          >
            <FiChevronLeft className="h-6 w-6" />
          </button>

          {/* Embla */}
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex -mx-3">
              {items.map((item, i) => (
                <div
                  key={i}
                  className="shrink-0 snap-start px-3 basis-full md:basis-1/2 lg:basis-1/3"
                >
                  <a
                    href={item.href ?? "#"}
                    target={item.href ? "_blank" : "_self"}
                    rel="noreferrer"
                    className="block group"
                  >
                    <div className="relative rounded-2xl overflow-hidden bg-[#0E2230]">
                      <img
                        src={item.src}
                        alt={item.alt}
                        className="w-full aspect-square object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 ring-1 ring-white/20" />
                    </div>
                    <p className="mt-3 text-center text-sm text-[#0B1320]/70 group-hover:text-[#0B1320] transition">
                      {item.alt}
                    </p>
                  </a>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={scrollNext}
            aria-label="Próximo"
            className="hidden md:flex absolute -right-6 top-1/2 -translate-y-1/2 z-10 h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-black/10 hover:scale-105 transition"
          >
            <FiChevronRight className="h-6 w-6" />
          </button>
        </div>

        {/* dots */}
        <div className="mt-6 flex items-center justify-center gap-2">
          {scrollSnaps.map((_, i) => (
            <button
              key={i}
              aria-label={`Ir para slide ${i + 1}`}
              onClick={() => scrollTo(i)}
              className={`h-2.5 w-2.5 rounded-full transition ${
                selectedIndex === i
                  ? "bg-[#111827]"
                  : "bg-gray-300 hover:bg-gray-400"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
