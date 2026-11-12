/** Small photo flies from the tapped button into the cart tab. */
export function flyToCart(from: Element | null, image?: string | null) {
  if (typeof window === "undefined" || !from) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const target = document.getElementById("cart-tab-icon");
  if (!target) return;
  const a = from.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  const dot = document.createElement("div");
  dot.className = "fly-dot";
  dot.style.left = `${a.left + a.width / 2 - 23}px`;
  dot.style.top = `${a.top + a.height / 2 - 23}px`;
  dot.style.background = "#f1d6da";
  if (image) {
    const img = document.createElement("img");
    img.src = image;
    img.alt = "";
    dot.appendChild(img);
  }
  document.body.appendChild(dot);
  const dx = b.left + b.width / 2 - (a.left + a.width / 2);
  const dy = b.top + b.height / 2 - (a.top + a.height / 2);
  const anim = dot.animate(
    [
      { transform: "translate(0,0) scale(1)", opacity: 1 },
      { transform: `translate(${dx * 0.35}px, ${dy * 0.35 - 90}px) scale(1.12)`, opacity: 1, offset: 0.4 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.25)`, opacity: 0.7 },
    ],
    { duration: 720, easing: "cubic-bezier(0.45, 0, 0.25, 1)" },
  );
  anim.onfinish = () => {
    dot.remove();
    target.classList.remove("cart-bump");
    void (target as HTMLElement).offsetWidth;
    target.classList.add("cart-bump");
  };
}
